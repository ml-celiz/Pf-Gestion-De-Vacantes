class AppNavbar extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/navbar/navbar.css');

            // 1. Descargar la plantilla HTML
            const response = await fetch('components/navbar/navbar.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista del navbar.');
            }

            const htmlContent = await response.text();

            // 2. Insertar el HTML (sus estilos ya están cargados)
            await estilos;

            this.innerHTML = htmlContent;

            // 3. Inicializar eventos
            this.initEvents();
        } catch (error) {
            console.error('Error al inicializar <app-navbar>:', error);
        }
    }

    initEvents() {
        // =====================================================
        // DETECTAR SI EL NAVBAR ESTÁ EN EL LOGIN
        // =====================================================
        const isPublic = this.dataset.public === 'true';

        // =====================================================
        // BOTÓN HOME
        // =====================================================
        const btnHome = this.querySelector('#btn-home-navbar');

        if (btnHome) {
            if (isPublic) {
                // En el login se muestra el logo,
                // pero no funciona como botón
                btnHome.disabled = true;
                btnHome.style.cursor = 'default';
            } else {
                // En las vistas autenticadas sí funciona
                btnHome.addEventListener('click', () => this.navigateTo('menu'));
            }
        }

        // =====================================================
        // BOTÓN MODO INVITADO
        // =====================================================
        const btnGuest = this.querySelector('#btn-guest-navbar');

        if (btnGuest) {
            if (isPublic) {
                // Solo tiene sentido en el login
                btnGuest.hidden = false;

                btnGuest.addEventListener('click', () => {
                    this.dispatchEvent(
                        new CustomEvent('modo-invitado', {
                            bubbles: true
                        })
                    );
                });
            } else {
                btnGuest.remove();
            }
        }

        // =====================================================
        // MENÚ DE USUARIO
        // =====================================================
        const userDropdown = this.querySelector('.dropdown');

        if (isPublic) {
            // En el login no se muestra "Mi cuenta"
            if (userDropdown) {
                userDropdown.remove();
            }
        } else {
            this.aplicarPermisos();

            // =================================================
            // OPCIONES DEL MENÚ
            // Mi perfil y Preguntas frecuentes se abren como
            // dialog sobre la vista actual.
            // =================================================
            const menuItems = this.querySelectorAll('.user-dropdown-item[data-dialog]');

            menuItems.forEach(item => {
                item.addEventListener('click', () => this.abrirDialogo(item.dataset.dialog));
            });

            // =================================================
            // CERRAR SESIÓN
            // =================================================
            const btnLogout = this.querySelector('#btn-logout-navbar');

            if (btnLogout) {
                btnLogout.addEventListener('click', () => this.logout());
            }
        }
    }

    // =====================================================
    // OPCIONES SEGÚN LA SESIÓN
    // Hay un navbar por vista y se construyen en distintos
    // momentos, así que esto se vuelve a aplicar cada vez que
    // se muestra una vista (ver menu.js).
    // =====================================================
    aplicarPermisos() {
        const esInvitado = AuthService.esInvitado();

        // Ocultar las opciones a las que no puede entrar
        // (el invitado no tiene cuenta, así que no ve "Mi perfil")

        this.querySelectorAll('.user-dropdown-item[data-dialog]').forEach(item => {
            const permitido = AuthService.puedeAcceder(item.dataset.dialog);
            const contenedor = item.closest('li') || item;

            contenedor.hidden = !permitido;
        });

        // Nombre que se muestra en el botón

        const nombreUsuario = this.querySelector('.user-name');

        if (nombreUsuario) {
            nombreUsuario.textContent =
                esInvitado
                    ? 'Invitado'
                    : 'Mi cuenta';
        }

        // Texto de la salida

        const btnSalir = this.querySelector('#btn-logout-navbar');

        if (btnSalir) {
            btnSalir.innerHTML = `
                <i class="bi bi-box-arrow-right me-2"></i>
                ${
                    esInvitado
                        ? 'Salir del modo invitado'
                        : 'Cerrar sesión'
                }
            `;
        }
    }

    // DIALOGS DE LA CUENTA
    // <app-perfil> y <app-faq> se muestran al conectarse
    // al documento y se eliminan solos al cerrarse.
    abrirDialogo(nombre) {
        const tag = `app-${nombre}`;

        // Ya hay uno abierto
        if (document.querySelector(tag)) return;

        if (!AuthService.puedeAcceder(nombre)) return;

        document.body.appendChild(document.createElement(tag));
    }

    // NAVEGACIÓN
    navigateTo(route) {
        console.log('Navegando hacia:', route);

        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: {
                    route: route
                },
                bubbles: true
            })
        );
    }

    // CERRAR SESIÓN
    async logout() {
        console.log('Cerrando sesión...');

        try {
            // Avisar al backend que la sesión terminó
            await AuthService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}

// Registro del Web Component
customElements.define('app-navbar', AppNavbar);
