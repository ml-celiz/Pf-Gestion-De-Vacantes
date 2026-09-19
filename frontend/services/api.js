const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {

    static async request(endpoint, options = {}) {

        const token =
            localStorage.getItem('auth_token');

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Agregar token si existe
        if (token) {

            headers['Authorization'] =
                `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}${endpoint}`,
                    config
                );

            const data =
                await response.json();

            // SESIÓN NO VÁLIDA / EXPIRADA
            if (response.status === 401) {

                // No hacer esto durante el login,
                // porque un 401 ahí simplemente significa
                // credenciales incorrectas.
                if (endpoint !== '/auth/login') {

                    localStorage.removeItem(
                        'auth_token'
                    );

                    localStorage.removeItem(
                        'user_info'
                    );

                    // Avisar a la aplicación
                    document.dispatchEvent(
                        new CustomEvent('auth-expired')
                    );
                }

                throw new Error(
                    data.message ||
                    'La sesión ha expirado.'
                );
            }

            // OTROS ERRORES
            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Error ${response.status}: Transacción no procesada.`
                );
            }


            return data;

        } catch (error) {

            console.error(
                'API Error:',
                error.message
            );

            throw error;
        }
    }


    static get(endpoint) {

        return this.request(
            endpoint,
            {
                method: 'GET'
            }
        );
    }


    static post(endpoint, body) {

        return this.request(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(body)
            }
        );
    }
}