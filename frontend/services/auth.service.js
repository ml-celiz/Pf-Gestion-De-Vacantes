class AuthService {
    // Marca de "modo invitado": navegación sin cuenta ni token.
    static GUEST_KEY = 'guest_mode';

    // REGISTRO (alta pública desde el login)
    // El backend asigna siempre el rol `pos`.
    static async registrar(datos) {
        return ApiClient.post('/auth/registro', datos);
    }

    // MODO INVITADO
    // No hay sesión en el servidor: solo se puede consultar
    // el listado de vacantes, que es público.
    static entrarModoInvitado() {
        this.clearSession();

        localStorage.setItem(this.GUEST_KEY, 'true');
    }

    static esInvitado() {
        return localStorage.getItem(this.GUEST_KEY) === 'true';
    }

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
            localStorage.setItem('auth_token', response.token);

            // Guardar información del usuario
            localStorage.setItem('user_info', JSON.stringify(response.usuario));
        }

        return response;
    }

    // VERIFICAR SESIÓN AL RECARGAR LA PÁGINA
    static async restoreSession() {
        // El invitado no tiene token que validar
        if (this.esInvitado()) return true;

        const token = this.getToken();

        if (!token) return false;

        try {
            const response = await ApiClient.get('/auth/me');

            if (response && response.usuario) {
                // Sobrescribir directamente con el usuario fresco del servidor
                localStorage.setItem('user_info', JSON.stringify(response.usuario));

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
            await ApiClient.post('/auth/logout', {});
        } catch (error) {
            console.warn('No se pudo cerrar la sesión en el servidor:', error.message);
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
        localStorage.removeItem(this.GUEST_KEY);
    }

    // OBTENER TOKEN
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    // PANTALLAS PERMITIDAS POR ROL
    // Clave = ruta del menú. Un usuario con varios roles
    // accede a la unión de las pantallas de cada uno.
    //   admin -> todo
    //   ra    -> configuraciones + vacantes
    //   pos   -> vacantes + postulaciones
    //   jfc   -> vacantes
    //   inv   -> vacantes
    static PERMISOS_RUTAS = {
        'vacantes':         ['admin', 'ra', 'jfc', 'pos', 'inv'],
        'postulaciones':    ['admin', 'pos'],
        'gestion-vacantes': ['admin', 'ra'],
        'roles':            ['admin'],
        'usuarios':         ['admin'],
        // Dialogs del menú "Mi cuenta" (no son pantallas)
        'perfil':           ['admin', 'ra', 'jfc', 'pos', 'inv'],
        'faq':              ['admin', 'ra', 'jfc', 'pos', 'inv']
    };

    // NOMBRES DE ROL DEL USUARIO (en minúsculas)
    static getRoles() {
        // El invitado no tiene cuenta: se le dan los permisos de `inv`
        if (this.esInvitado()) {
            return ['inv'];
        }

        const usuario = this.getUser();

        if (!usuario || !Array.isArray(usuario.roles)) {
            return [];
        }

        return usuario.roles.map(item =>
            String(item.rol ?? '').trim().toLowerCase()
        );
    }

    // ¿EL USUARIO PUEDE ENTRAR A ESA PANTALLA?
    static puedeAcceder(ruta) {
        if (ruta === 'menu' || ruta === 'faq') {
            return true;
        }

        // El invitado no tiene cuenta que consultar ni editar
        if (ruta === 'perfil' && this.esInvitado()) {
            return false;
        }

        const rolesPermitidos = this.PERMISOS_RUTAS[ruta];

        if (!rolesPermitidos) {
            return false;
        }

        return this.getRoles().some(rol =>
            rolesPermitidos.includes(rol)
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
