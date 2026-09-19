class AuthService {

    // LOGIN
    static async login(email, contrasenea) {

        const response = await ApiClient.post(
            '/auth/login',
            {
                email,
                contrasenea
            }
        );

        if (response.token) {

            // Guardar token
            localStorage.setItem(
                'auth_token',
                response.token
            );

            // Guardar información del usuario
            localStorage.setItem(
                'user_info',
                JSON.stringify(response.usuario)
            );
        }

        return response;
    }

    // VERIFICAR SESIÓN AL RECARGAR LA PÁGINA
    static async restoreSession() {
        const token = this.getToken();

        if (!token) return false;

        try {
            const response = await ApiClient.get('/auth/me');

            if (response && response.usuario) {
                // Sobrescribir directamente con el usuario fresco del servidor
                localStorage.setItem(
                    'user_info',
                    JSON.stringify(response.usuario)
                );

                return true;
            }

            return false;

        } catch (error) {
            console.warn('La sesión guardada ya no es válida.');
            this.clearSession();
            return false;
        }
    }

    // LOGOUT
    static async logout() {

        try {

            await ApiClient.post(
                '/auth/logout',
                {}
            );

        } catch (error) {

            console.warn(
                'No se pudo cerrar la sesión en el servidor:',
                error.message
            );

        } finally {

            this.clearSession();

            // Volver al login
            window.location.href = 'index.html';
        }
    }

    // LIMPIAR SESIÓN LOCAL
    static clearSession() {

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
    }

    // OBTENER TOKEN
    static getToken() {

        return localStorage.getItem(
            'auth_token'
        );
    }
    
    // OBTENER USUARIO
    static getUser() {
        const userStr = localStorage.getItem('user_info');
        if (!userStr) return null;

        try {
            const user = JSON.parse(userStr);
            return {
                ...user,
                id: user.id ?? user.id_usuario ?? null
            };
        } catch (e) {
            return null;
        }
    }
}