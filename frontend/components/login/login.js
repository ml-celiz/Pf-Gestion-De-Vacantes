class AppLogin extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/login/login.css');

            // 1. Descargar la plantilla HTML correspondiente a este componente
            const response = await fetch('components/login/login.html');
            if (!response.ok) throw new Error('No se pudo cargar la vista del login.');

            const htmlContent = await response.text();

            // 2. Insertar el HTML (sus estilos ya están cargados)
            await estilos;

            this.innerHTML = htmlContent;

            // 3. Vincular lógica y eventos
            this.initEvents();
        } catch (error) {
            console.error('Error al inicializar <app-login>:', error);
        }
    }

    // =====================================================
    // ALTERNAR LOGIN / REGISTRO
    // =====================================================
    mostrarRegistro() {
        const login = this.querySelector('#seccion-login');
        const registro = this.querySelector('#seccion-registro');

        if (!login || !registro) return;

        login.hidden = true;
        registro.hidden = false;

        this.clearAlert();

        const nombre = this.querySelector('#registro-nombre');

        if (nombre) nombre.focus();
    }

    mostrarLogin() {
        const login = this.querySelector('#seccion-login');
        const registro = this.querySelector('#seccion-registro');

        if (!login || !registro) return;

        registro.hidden = true;
        login.hidden = false;
    }

    initEvents() {
        this.initRegistro();

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

            const isFormValid = this.validateInputs(emailInput, passwordInput);
            if (!isFormValid) return;

            this.setLoading(btnSubmit, btnSpinner, btnText, true);

            try {
                // LLAMADA A TU SERVICIO (Esto debe estar funcionando)
                const result = await AuthService.login(
                    emailInput.value.trim(),
                    passwordInput.value
                );

                this.showAlert(
                    alertContainer,
                    'success',
                    '¡Autenticación exitosa! Redireccionando...'
                );

                setTimeout(() => {
                    console.log('Usuario autenticado con éxito:', result.usuario);

                    const loginView = document.getElementById('login-view');
                    const menuView = document.getElementById('menu-view');

                    if (loginView && menuView) {
                        // Limpiar mensaje de autenticación
                        this.clearAlert();

                        loginView.style.display = 'none';
                        menuView.style.display = 'block';

                        // Descartar paneles armados con otro rol
                        // (por ejemplo, los del modo invitado)
                        if (window.limpiarVistasDinamicas) {
                            window.limpiarVistasDinamicas();
                        }

                        // El menú se creó antes del login: ahora que hay
                        // usuario, mostrar solo lo que le corresponde
                        const menu = menuView.querySelector('app-menu');

                        if (menu && menu.aplicarPermisos) {
                            menu.aplicarPermisos();
                        }
                    } else {
                        console.error("ERROR: No se encontraron las vistas.");
                    }
                }, 1200);
            } catch (error) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    error.message || 'Credenciales inválidas. Verifique e intente nuevamente.'
                );
            } finally {
                this.setLoading(btnSubmit, btnSpinner, btnText, false);
            }
        });
    }

    // =====================================================
    // REGISTRO DE UNA CUENTA NUEVA
    // =====================================================
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

            // VALIDACIONES

            const marcar = (campo, invalido) => {
                campo.classList.toggle('is-invalid', invalido);
            };

            marcar(nombre, !nombre.value.trim());
            marcar(apellido, !apellido.value.trim());
            marcar(email, !email.value.trim() || !email.checkValidity());
            marcar(contrasena, contrasena.value.length < 8);

            if (!nombre.value.trim()) {
                nombre.focus();
                return;
            }

            if (!apellido.value.trim()) {
                apellido.focus();
                return;
            }

            if (!email.value.trim() || !email.checkValidity()) {
                email.focus();
                return;
            }

            if (dni.value.trim() && !/^\d+$/.test(dni.value.trim())) {
                marcar(dni, true);

                this.showAlert(alertContainer, 'danger', 'El DNI debe contener solo números.');

                dni.focus();
                return;
            }

            marcar(dni, false);

            if (contrasena.value.length < 8) {
                this.showAlert(
                    alertContainer,
                    'danger',
                    'La contraseña debe tener al menos 8 caracteres.'
                );

                contrasena.focus();
                return;
            }

            if (contrasena.value !== contrasena2.value) {
                marcar(contrasena2, true);

                this.showAlert(alertContainer, 'danger', 'Las contraseñas no coinciden.');

                contrasena2.focus();
                return;
            }

            marcar(contrasena2, false);

            // ENVÍO

            this.setLoadingRegistro(btnSubmit, btnSpinner, btnText, true);

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
                registroForm.reset();

                this.mostrarLogin();

                const emailLogin = this.querySelector('#email');

                if (emailLogin) {
                    emailLogin.value = email.value.trim();
                }

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
                    error.message ||
                    'No se pudo crear la cuenta. Intentá nuevamente.'
                );
            } finally {
                this.setLoadingRegistro(btnSubmit, btnSpinner, btnText, false);
            }
        });
    }

    setLoadingRegistro(btnSubmit, btnSpinner, btnText, isLoading) {
        btnSubmit.disabled = isLoading;

        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'Creando cuenta...';
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Crear cuenta';
        }
    }

    validateInputs(emailInput, passwordInput) {
        let isValid = true;

        if (!emailInput.value || !emailInput.checkValidity()) {
            emailInput.classList.add('is-invalid');
            isValid = false;
        } else {
            emailInput.classList.remove('is-invalid');
        }

        if (!passwordInput.value.trim()) {
            passwordInput.classList.add('is-invalid');
            isValid = false;
        } else {
            passwordInput.classList.remove('is-invalid');
        }

        return isValid;
    }

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

        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    }

    setLoading(btnSubmit, btnSpinner, btnText, isLoading) {
        btnSubmit.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'Autenticando...';
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Iniciar Sesión';
        }
    }
}

// Registro del elemento personalizado en el navegador
customElements.define('app-login', AppLogin);
