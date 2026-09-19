class AppLogin extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // 1. Descargar la plantilla HTML correspondiente a este componente
            const response = await fetch('components/login/login.html');
            if (!response.ok) throw new Error('No se pudo cargar la vista del login.');
            
            const htmlContent = await response.text();

            // 2. Insertar los estilos específicos y la plantilla HTML
            this.innerHTML = `
                <link rel="stylesheet" href="components/login/login.css">
                ${htmlContent}
            `;

            // 3. Vincular lógica y eventos
            this.initEvents();
        } catch (error) {
            console.error('Error al inicializar <app-login>:', error);
        }
    }

    initEvents() {
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

                    console.log(
                        'Usuario autenticado con éxito:',
                        result.usuario
                    );

                    const loginView = document.getElementById('login-view');
                    const menuView = document.getElementById('menu-view');

                    if (loginView && menuView) {

                        // Limpiar mensaje de autenticación
                        this.clearAlert();

                        loginView.style.display = 'none';
                        menuView.style.display = 'block';

                    } else {

                        console.error(
                            "ERROR: No se encontraron las vistas."
                        );
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

        const alertContainer =
            this.querySelector('#alert-container');

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