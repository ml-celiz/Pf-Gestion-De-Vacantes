const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: Transacción no procesada.`);
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
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}