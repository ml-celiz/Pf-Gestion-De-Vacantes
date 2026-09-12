class AuthService {
    static async login(email, contrasenea) {
        // Coincide estrictamente con los campos requeridos en AuthController.php
        const response = await ApiClient.post('/auth/login', { email, contrasenea });
        
        if (response.token) {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_info', JSON.stringify(response.usuario));
        }
        
        return response;
    }

    static async logout() {
        try {
            await ApiClient.post('/auth/logout', {});
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            window.location.href = 'index.html';
        }
    }

    static getToken() {
        return localStorage.getItem('auth_token');
    }

    static getUser() {
        const user = localStorage.getItem('user_info');
        return user ? JSON.parse(user) : null;
    }
}