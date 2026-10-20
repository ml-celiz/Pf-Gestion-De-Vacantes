/*
* COMPONENTE <app-login>
* Pantalla de acceso con cuatro secciones que se alternan:
*   - login:       iniciar sesión               POST /api/auth/login
*   - registro:    crear una cuenta (rol pos)   POST /api/auth/registro
*   - recuperar:   pedir el link por correo     POST /api/auth/recuperar
*   - restablecer: elegir contraseña nueva      POST /api/auth/restablecer
*/
class AppLogin extends HTMLElement {
    static SECCIONES = ['login', 'registro', 'recuperar', 'restablecer'];

    // =========================================================
    // ESTADO
    // =========================================================
    constructor() {
        super();

        // Token del link de recuperación (?restablecer=TOKEN)
        this.tokenRestablecer = null;
    }

    // =========================================================
    // CICLO DE VIDA: carga el HTML y el CSS del componente
    // =========================================================
    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/login/login.css');

            const response = await fetch('components/login/login.html');
            if (!response.ok) throw new Error('No se pudo cargar la vista del login.');

            const htmlContent = await response.text();

            await estilos;

            this.innerHTML = htmlContent;

            agregarOjosContrasena(this);

            this.initEvents();
        } catch (error) {
            console.error('Error al inicializar <app-login>:', error);
        }
    }

    // =========================================================
    // EVENTOS
    // =========================================================
    initEvents() {
        this.initLogin();
        this.initRegistro();
        this.initRecuperacion();
    }

    // =========================================================
    // NAVEGACIÓN ENTRE SECCIONES
    // =========================================================

    // Muestra una sección y oculta las demás
    mostrarSeccion(nombre) {
        AppLogin.SECCIONES.forEach(seccion => {
            const elemento = this.querySelector(`#seccion-${seccion}`);

            if (elemento) elemento.hidden = seccion !== nombre;
        });
    }

    mostrarLogin() {
        this.mostrarSeccion('login');
    }

    mostrarRegistro() {
        this.mostrarSeccion('registro');
        this.clearAlert();

        const nombre = this.querySelector('#registro-nombre');

        if (nombre) nombre.focus();
    }

    mostrarRecuperar() {
        this.mostrarSeccion('recuperar');
        this.clearAlert();

        const email = this.querySelector('#recuperar-email');
        const emailLogin = this.querySelector('#email');

        if (email) {
            // Si ya lo había escrito en el login, se reutiliza
            if (emailLogin && emailLogin.value.trim() && !email.value) {
                email.value = emailLogin.value.trim();
            }

            email.focus();
        }
    }

    /*
    * Link del correo de recuperación (index.html lee ?restablecer=TOKEN).
    * Puede llamarse antes de que el componente termine de cargar: el
    * token queda guardado y la sección se muestra al inicializar.
    */
    abrirRestablecer(token) {
        this.tokenRestablecer = token;

        if (!this.querySelector('#seccion-restablecer')) return;

        this.mostrarSeccion('restablecer');

        const contrasena = this.querySelector('#restablecer-contrasena');

        if (contrasena) contrasena.focus();
    }

    // =========================================================
    // LOGIN
    // =========================================================
    initLogin() {
        const loginForm = this.querySelector('#login-form');
        const emailInput = this.querySelector('#email');
        const passwordInput = this.querySelector('#contrasenea');
        const alertContainer = this.querySelector('#alert-container');
        const btnSubmit = this.querySelector('#btn-submit');
        const btnSpinner = this.querySelector('#btn-spinner');
        const btnText = this.querySelector('#btn-text');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertContainer.innerHTML = '';

            if (!this.validarLogin(emailInput, passwordInput)) return;

            this.setCargando(btnSubmit, btnSpinner, btnText, true, 'Autenticando...', 'Iniciar Sesión');

            try {
                await AuthService.login(emailInput.value.trim(), passwordInput.value);

                this.showAlert(alertContainer, 'success', '¡Autenticación exitosa! Redireccionando...');

                setTimeout(() => this.entrarAlMenu(), 1200);
            } catch (error) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    this.escapar(error.message || 'Credenciales inválidas. Verifique e intente nuevamente.')
                );
            } finally {
                this.setCargando(btnSubmit, btnSpinner, btnText, false, 'Autenticando...', 'Iniciar Sesión');
            }
        });
    }

    // En el login solo se controla que estén completos (las reglas de
    // contraseña aplican al crearla, no al ingresar)
    validarLogin(emailInput, passwordInput) {
        const emailInvalido = Validaciones.email(emailInput.value) !== null;
        const passwordVacia = !passwordInput.value.trim();

        emailInput.classList.toggle('is-invalid', emailInvalido);
        passwordInput.classList.toggle('is-invalid', passwordVacia);

        return !emailInvalido && !passwordVacia;
    }

    // Oculta el login y muestra el menú con los permisos del usuario
    entrarAlMenu() {
        const loginView = document.getElementById('login-view');
        const menuView = document.getElementById('menu-view');

        if (!loginView || !menuView) {
            console.error('ERROR: No se encontraron las vistas.');
            return;
        }

        this.clearAlert();

        loginView.style.display = 'none';
        menuView.style.display = 'block';

        // Descartar paneles armados con otro rol (por ejemplo, los del modo invitado)
        if (window.limpiarVistasDinamicas) {
            window.limpiarVistasDinamicas();
        }

        // El menú se creó antes del login: ahora que hay usuario,
        // mostrar solo lo que le corresponde
        const menu = menuView.querySelector('app-menu');

        if (menu && menu.aplicarPermisos) {
            menu.aplicarPermisos();
        }
    }

    // =========================================================
    // REGISTRO DE UNA CUENTA NUEVA
    // =========================================================
    initRegistro() {
        const btnIrRegistro = this.querySelector('#btn-ir-registro');
        const btnVolverLogin = this.querySelector('#btn-volver-login');
        const registroForm = this.querySelector('#registro-form');

        if (btnIrRegistro) {
            btnIrRegistro.addEventListener('click', () => this.mostrarRegistro());
        }

        if (btnVolverLogin) {
            btnVolverLogin.addEventListener('click', () => this.mostrarLogin());
        }

        if (!registroForm) return;

        const alertContainer = this.querySelector('#registro-alert-container');
        const btnSubmit = this.querySelector('#btn-registro-submit');
        const btnSpinner = this.querySelector('#btn-registro-spinner');
        const btnText = this.querySelector('#btn-registro-text');

        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            alertContainer.innerHTML = '';

            const nombre = this.querySelector('#registro-nombre');
            const apellido = this.querySelector('#registro-apellido');
            const email = this.querySelector('#registro-email');
            const dni = this.querySelector('#registro-dni');
            const telefono = this.querySelector('#registro-telefono');
            const contrasena = this.querySelector('#registro-contrasena');
            const contrasena2 = this.querySelector('#registro-contrasena-2');

            // VALIDACIONES: se marca y enfoca el primer campo con error
            const reglas = [
                [nombre, Validaciones.nombre(nombre.value, 'nombre')],
                [apellido, Validaciones.nombre(apellido.value, 'apellido')],
                [email, Validaciones.email(email.value)],
                [dni, Validaciones.dni(dni.value)],
                [telefono, Validaciones.telefono(telefono.value)],
                [contrasena, Validaciones.contrasena(contrasena.value)],
                [contrasena2, contrasena.value !== contrasena2.value ? 'Las contraseñas no coinciden.' : null]
            ];

            if (!this.validarCampos(reglas, alertContainer)) return;

            // ENVÍO
            this.setCargando(btnSubmit, btnSpinner, btnText, true, 'Creando cuenta...', 'Crear cuenta');

            try {
                await AuthService.registrar({
                    nombre: nombre.value.trim(),
                    apellido: apellido.value.trim(),
                    email: email.value.trim(),
                    dni: dni.value.trim(),
                    telefono: telefono.value.trim(),
                    contrasena: contrasena.value
                });

                // Volver al login con el email ya cargado
                const emailCreado = email.value.trim();

                registroForm.reset();
                this.mostrarLogin();

                const emailLogin = this.querySelector('#email');

                if (emailLogin) emailLogin.value = emailCreado;

                this.showAlert(
                    this.querySelector('#alert-container'),
                    'success',
                    '¡Cuenta creada! Ingresá con tu correo y contraseña.'
                );

                const passLogin = this.querySelector('#contrasenea');

                if (passLogin) passLogin.focus();
            } catch (error) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    this.escapar(error.message || 'No se pudo crear la cuenta. Intentá nuevamente.')
                );
            } finally {
                this.setCargando(btnSubmit, btnSpinner, btnText, false, 'Creando cuenta...', 'Crear cuenta');
            }
        });
    }

    // =========================================================
    // RECUPERACIÓN DE CONTRASEÑA
    // =========================================================
    initRecuperacion() {
        const btnIrRecuperar = this.querySelector('#btn-ir-recuperar');

        if (btnIrRecuperar) {
            btnIrRecuperar.addEventListener('click', () => this.mostrarRecuperar());
        }

        this.querySelectorAll('[data-volver-login]').forEach(boton => {
            boton.addEventListener('click', () => this.mostrarLogin());
        });

        this.initPedirLink();
        this.initRestablecer();

        // El link del correo llegó antes de que el componente cargara
        if (this.tokenRestablecer) {
            this.abrirRestablecer(this.tokenRestablecer);
        }
    }

    // 1) Pedir el link de recuperación por correo
    initPedirLink() {
        const recuperarForm = this.querySelector('#recuperar-form');

        if (!recuperarForm) return;

        const email = this.querySelector('#recuperar-email');
        const alertContainer = this.querySelector('#recuperar-alert-container');
        const boton = this.querySelector('#btn-recuperar-submit');
        const spinner = this.querySelector('#btn-recuperar-spinner');
        const texto = this.querySelector('#btn-recuperar-text');

        recuperarForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            alertContainer.innerHTML = '';

            const invalido = Validaciones.email(email.value) !== null;

            email.classList.toggle('is-invalid', invalido);

            if (invalido) {
                email.focus();
                return;
            }

            this.setCargando(boton, spinner, texto, true, 'Enviando...', 'Enviar enlace');

            try {
                const respuesta = await AuthService.solicitarRecuperacion(email.value.trim());

                this.showAlert(alertContainer, 'success', this.escapar(respuesta.message));
            } catch (error) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    this.escapar(error.message || 'No se pudo enviar el correo. Intentá nuevamente.')
                );
            } finally {
                this.setCargando(boton, spinner, texto, false, 'Enviando...', 'Enviar enlace');
            }
        });
    }

    // 2) Elegir la contraseña nueva (formulario del link del correo)
    initRestablecer() {
        const restablecerForm = this.querySelector('#restablecer-form');

        if (!restablecerForm) return;

        const contrasena = this.querySelector('#restablecer-contrasena');
        const contrasena2 = this.querySelector('#restablecer-contrasena-2');
        const alertContainer = this.querySelector('#restablecer-alert-container');
        const boton = this.querySelector('#btn-restablecer-submit');
        const spinner = this.querySelector('#btn-restablecer-spinner');
        const texto = this.querySelector('#btn-restablecer-text');

        restablecerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            alertContainer.innerHTML = '';

            const reglas = [
                [contrasena, Validaciones.contrasena(contrasena.value)],
                [contrasena2, contrasena.value !== contrasena2.value ? 'Las contraseñas no coinciden.' : null]
            ];

            if (!this.validarCampos(reglas, alertContainer)) return;

            this.setCargando(boton, spinner, texto, true, 'Guardando...', 'Guardar contraseña');

            try {
                const respuesta = await AuthService.restablecerContrasena(
                    this.tokenRestablecer || '',
                    contrasena.value
                );

                this.tokenRestablecer = null;
                restablecerForm.reset();

                // Volver al login con el aviso de éxito
                this.mostrarLogin();

                this.showAlert(this.querySelector('#alert-container'), 'success', this.escapar(respuesta.message));

                const emailLogin = this.querySelector('#email');

                if (emailLogin) emailLogin.focus();
            } catch (error) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    this.escapar(error.message || 'No se pudo guardar la contraseña. Intentá nuevamente.')
                );
            } finally {
                this.setCargando(boton, spinner, texto, false, 'Guardando...', 'Guardar contraseña');
            }
        });
    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    /*
    * Recorre pares [campo, mensajeDeError] en orden: marca cada campo
    * válido/ inválido y, ante el primer error, lo muestra y enfoca el campo.
    * Devuelve true si no hubo errores.
    */
    validarCampos(reglas, alertContainer) {
        reglas.forEach(([campo, error]) => campo.classList.toggle('is-invalid', error !== null));

        const primero = reglas.find(([, error]) => error !== null);

        if (primero) {
            this.showAlert(alertContainer, 'danger', this.escapar(primero[1]));
            primero[0].focus();
            return false;
        }

        return true;
    }

    // Deshabilita el botón mientras se envía (evita el doble envío)
    setCargando(boton, spinner, texto, cargando, textoCargando, textoNormal) {
        boton.disabled = cargando;
        spinner.classList.toggle('d-none', !cargando);
        texto.textContent = cargando ? textoCargando : textoNormal;
    }

    // Alerta de Bootstrap dentro del contenedor indicado
    showAlert(container, type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar notificación"></button>
        `;
        container.appendChild(alertDiv);
    }

    clearAlert() {
        const alertContainer = this.querySelector('#alert-container');

        if (alertContainer) alertContainer.innerHTML = '';
    }

    // Evita que un texto se interprete como HTML
    escapar(texto) {
        const div = document.createElement('div');
        div.textContent = String(texto ?? '');
        return div.innerHTML;
    }
}

customElements.define('app-login', AppLogin);
