class AppNavbar extends HTMLElement {

    constructor() {
        super();
    }

    async connectedCallback() {

        try {

            // 1. Descargar la plantilla HTML
            const response = await fetch(
                'components/navbar/navbar.html'
            );

            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar la vista del navbar.'
                );
            }

            const htmlContent =
                await response.text();


            // 2. Insertar CSS + HTML
            this.innerHTML = `
                <link
                    rel="stylesheet"
                    href="components/navbar/navbar.css"
                >

                ${htmlContent}
            `;

            // 3. Inicializar eventos
            this.initEvents();

        } catch (error) {

            console.error(
                'Error al inicializar <app-navbar>:',
                error
            );

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
                btnHome.addEventListener(
                    'click',
                    () => this.navigateTo('menu')
                );

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

            // =================================================
            // OPCIONES DEL MENÚ
            // =================================================
            const menuItems = this.querySelectorAll(
                '.user-dropdown-item[data-route]'
            );

            menuItems.forEach(item => {

                const route = item.dataset.route;

                item.addEventListener(
                    'click',
                    () => {
                        this.navigateTo(route);
                    }
                );
            });


            // =================================================
            // CERRAR SESIÓN
            // =================================================
            const btnLogout = this.querySelector(
                '#btn-logout-navbar'
            );

            if (btnLogout) {

                btnLogout.addEventListener(
                    'click',
                    () => this.logout()
                );

            }
        }
    }

    // NAVEGACIÓN
    navigateTo(route) {

        console.log(
            'Navegando hacia:',
            route
        );


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

            console.error(
                'Error al cerrar sesión:',
                error
            );

        }

    }

}

// Registro del Web Component
customElements.define('app-navbar', AppNavbar);