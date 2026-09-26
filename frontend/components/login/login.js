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
    // ALTERNAR LOGIN / REGISTRO / RECUPERAR / RESTABLECER
    // =====================================================
    static SECCIONES = ['login', 'registro', 'recuperar', 'restablecer'];

    mostrarSeccion(nombre) {
        AppLogin.SECCIONES.forEach(seccion => {
            const elemento = this.querySelector(`#seccion-${seccion}`);

            if (elemento) elemento.hidden = seccion !== nombre;
        });
    }

    mostrarRegistro() {
        this.mostrarSeccion('registro');

        this.clearAlert();

        const nombre = this.querySelector('#registro-nombre');

        if (nombre) nombre.focus();
    }

    mostrarLogin() {
        this.mostrarSeccion('login');
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

    initEvents() {
        this.initRegistro();
        this.initRecuperacion();

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

    // =====================================================
    // RECUPERACIÓN DE CONTRASEÑA
    // =====================================================
    initRecuperacion() {
        const btnIrRecuperar = this.querySelector('#btn-ir-recuperar');

        if (btnIrRecuperar) {
            btnIrRecuperar.addEventListener('click', () => this.mostrarRecuperar());
        }

        this.querySelectorAll('[data-volver-login]').forEach(boton => {
            boton.addEventListener('click', () => this.mostrarLogin());
        });

        // 1) PEDIR EL LINK

        const recuperarForm = this.querySelector('#recuperar-form');

        if (recuperarForm) {
            const email = this.querySelector('#recuperar-email');
            const alertContainer = this.querySelector('#recuperar-alert-container');
            const boton = this.querySelector('#btn-recuperar-submit');
            const spinner = this.querySelector('#btn-recuperar-spinner');
            const texto = this.querySelector('#btn-recuperar-text');

            recuperarForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                alertContainer.innerHTML = '';

                const invalido = !email.value.trim() || !email.checkValidity();

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

        // 2) ELEGIR LA CONTRASEÑA NUEVA

        const restablecerForm = this.querySelector('#restablecer-form');

        if (restablecerForm) {
            const contrasena = this.querySelector('#restablecer-contrasena');
            const contrasena2 = this.querySelector('#restablecer-contrasena-2');
            const alertContainer = this.querySelector('#restablecer-alert-container');
            const boton = this.querySelector('#btn-restablecer-submit');
            const spinner = this.querySelector('#btn-restablecer-spinner');
            const texto = this.querySelector('#btn-restablecer-text');

            restablecerForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                alertContainer.innerHTML = '';

                const corta = contrasena.value.length < 8;
                const distintas = contrasena.value !== contrasena2.value;

                contrasena.classList.toggle('is-invalid', corta);
                contrasena2.classList.toggle('is-invalid', !corta && distintas);

                if (corta) {
                    this.showAlert(alertContainer, 'danger', 'La contraseña debe tener al menos 8 caracteres.');
                    contrasena.focus();
                    return;
                }

                if (distintas) {
                    this.showAlert(alertContainer, 'danger', 'Las contraseñas no coinciden.');
                    contrasena2.focus();
                    return;
                }

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

                    this.showAlert(
                        this.querySelector('#alert-container'),
                        'success',
                        this.escapar(respuesta.message)
                    );

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

        // El link del correo llegó antes de que el componente cargara
        if (this.tokenRestablecer) {
            this.abrirRestablecer(this.tokenRestablecer);
        }
    }

    // Deshabilita el botón mientras se envía (evita el doble envío)
    setCargando(boton, spinner, texto, cargando, textoCargando, textoNormal) {
        boton.disabled = cargando;
        spinner.classList.toggle('d-none', !cargando);
        texto.textContent = cargando ? textoCargando : textoNormal;
    }

    escapar(texto) {
        const div = document.createElement('div');
        div.textContent = String(texto ?? '');
        return div.innerHTML;
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
