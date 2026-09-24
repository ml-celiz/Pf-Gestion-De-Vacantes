const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
    /*
    * Pedido base. Por defecto envía y espera JSON.
    * - body FormData: se manda tal cual (el navegador arma el multipart).
    * - respuesta 'blob': devuelve { blob, nombre } en lugar de JSON.
    */
    static async request(endpoint, options = {}, respuesta = 'json') {
        const token = localStorage.getItem('auth_token');
        const esFormData = options.body instanceof FormData;

        const headers = {
            ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
            'Accept': respuesta === 'blob' ? 'application/pdf, application/json' : 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

            // Los errores siempre vienen en JSON
            const esJson = (response.headers.get('Content-Type') || '').includes('application/json');
            const data = respuesta === 'json' || !response.ok
                ? (esJson ? await response.json() : {})
                : null;

            // SESIÓN NO VÁLIDA / EXPIRADA
            if (response.status === 401) {
                // En el login un 401 solo significa credenciales incorrectas
                if (endpoint !== '/auth/login') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');

                    document.dispatchEvent(new CustomEvent('auth-expired'));
                }

                throw new Error(data.message || 'La sesión ha expirado.');
            }

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: Transacción no procesada.`);
            }

            if (respuesta === 'blob') {
                return {
                    blob: await response.blob(),
                    nombre: this.nombreDeArchivo(response)
                };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }

    static put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Envío de archivos (multipart/form-data)
    static upload(endpoint, formData) {
        return this.request(endpoint, { method: 'POST', body: formData });
    }

    // Descarga un archivo y lo guarda en la computadora del usuario
    static async download(endpoint, nombrePorDefecto = 'archivo') {
        const { blob, nombre } = await this.request(endpoint, { method: 'GET' }, 'blob');
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');

        enlace.href = url;
        enlace.download = nombre || nombrePorDefecto;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        // Se libera después: algunos navegadores leen la URL tras el click
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // Nombre sugerido por el backend (Content-Disposition: attachment; filename="...")
    static nombreDeArchivo(response) {
        const disposicion = response.headers.get('Content-Disposition') || '';
        const coincidencia = disposicion.match(/filename="?([^";]+)"?/i);

        return coincidencia ? coincidencia[1] : null;
    }
}
