class AuthService {
    // Marca de "modo invitado": navegación sin cuenta ni token.
    static GUEST_KEY = 'guest_mode';

    // REGISTRO (alta pública desde el login)
    // El backend asigna siempre el rol `pos`.
    static async registrar(datos) {
        return ApiClient.post('/auth/registro', datos);
    }

    // RECUPERACIÓN DE CONTRASEÑA
    // 1) pide el link por correo  2) guarda la nueva con el token del link
    static async solicitarRecuperacion(email) {
        return ApiClient.post('/auth/recuperar', { email });
    }

    static async restablecerContrasena(token, contrasena) {
        return ApiClient.post('/auth/restablecer', { token, contrasena });
    }

    // MODO INVITADO
    // No hay sesión en el servidor: los permisos son los del rol `inv`
    // configurados en la base (el backend los devuelve sin token).
    static async entrarModoInvitado() {
        this.clearSession();

        localStorage.setItem(this.GUEST_KEY, 'true');

        await this.cargarPermisosInvitado();
    }

    static async cargarPermisosInvitado() {
        try {
            const response = await ApiClient.get('/auth/permisos');

            this.guardarPermisos(response.permisos);
        } catch (error) {
            console.warn('No se pudieron cargar los permisos del invitado:', error.message);

            this.guardarPermisos(null);
        }
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

            // Paneles y permisos por módulo de sus roles
            this.guardarPermisos(response.permisos);
        }

        return response;
    }

    // VERIFICAR SESIÓN AL RECARGAR LA PÁGINA
    static async restoreSession() {
        // El invitado no tiene token que validar; se refrescan sus permisos
        if (this.esInvitado()) {
            await this.cargarPermisosInvitado();
            return true;
        }

        const token = this.getToken();

        if (!token) return false;

        try {
            const response = await ApiClient.get('/auth/me');

            if (response && response.usuario) {
                // Sobrescribir directamente con el usuario fresco del servidor
                localStorage.setItem('user_info', JSON.stringify(response.usuario));

                // Permisos frescos: refleja cambios hechos en Roles sin volver a loguearse
                this.guardarPermisos(response.permisos);

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
        localStorage.removeItem(this.PERMISOS_KEY);
        localStorage.removeItem(this.GUEST_KEY);
    }

    // OBTENER TOKEN
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    // PERMISOS (vienen de la base: roles_paneles y roles_modulos)
    // { paneles: ['paneles-vacantes', ...],
    //   modulos: { vacantes: { leer, escribir, editar }, ... } }
    // Un usuario con varios roles tiene la unión de los permisos.
    static PERMISOS_KEY = 'user_permisos';

    // Pantalla (ruta del menú) -> panel de la tabla `paneles`
    static PANELES_RUTAS = {
        'vacantes':         'paneles-vacantes',
        'postulaciones':    'paneles-postulaciones',
        'gestion-vacantes': 'paneles-institucional',
        'roles':            'paneles-roles',
        'usuarios':         'paneles-usuarios'
    };

    static guardarPermisos(permisos) {
        localStorage.setItem(
            this.PERMISOS_KEY,
            JSON.stringify(permisos || { paneles: [], modulos: {} })
        );
    }

    static getPermisos() {
        try {
            const permisos = JSON.parse(localStorage.getItem(this.PERMISOS_KEY));

            return {
                paneles: Array.isArray(permisos?.paneles) ? permisos.paneles : [],
                modulos: permisos?.modulos || {}
            };
        } catch (e) {
            return { paneles: [], modulos: {} };
        }
    }

    // ¿Puede hacer `accion` ('leer' | 'escribir' | 'editar') sobre el módulo?
    //   leer -> consultar   escribir -> dar de alta   editar -> modificar y dar de baja
    static puede(modulo, accion) {
        const permiso = this.getPermisos().modulos[String(modulo).toLowerCase()];

        return Boolean(permiso && permiso[accion]);
    }

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

        // Mi perfil: cualquier usuario con cuenta (el invitado no tiene)
        if (ruta === 'perfil') {
            return !this.esInvitado() && Boolean(this.getToken());
        }

        // Pantallas: según los paneles asignados a sus roles
        const panel = this.PANELES_RUTAS[ruta];

        if (!panel) {
            return false;
        }

        return this.getPermisos().paneles.includes(panel);
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
