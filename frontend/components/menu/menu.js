/*
* COMPONENTE <app-menu>
* Menú principal: tarjetas de acceso a cada pantalla. Solo se muestran las
* que el rol del usuario puede abrir (AuthService.puedeAcceder).
*/
class AppMenu extends HTMLElement {

    // =========================================================
    // ESTADO
    // =========================================================
    constructor() {
        super();
    }

    // =========================================================
    // CICLO DE VIDA: carga el HTML y el CSS
    // =========================================================
    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/menu/menu.css');

            // 1. Cargar HTML
            const response = await fetch('components/menu/menu.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista del menú.');
            }

            const htmlContent = await response.text();

            // 2. Insertar el HTML (sus estilos ya están cargados)
            await estilos;

            this.innerHTML = htmlContent;

            // 3. Inicializar eventos
            this.initEvents();

            // 4. Mostrar solo lo que corresponde al rol del usuario
            this.aplicarPermisos();
        } catch (error) {
            console.error('Error al inicializar <app-menu>:', error);
        }
    }

    // =========================================================
    // EVENTOS
    // =========================================================
    // Click en cada tarjeta: navega a su pantalla
    initEvents() {
        // TARJETAS DEL MENÚ
        const menuCards = this.querySelectorAll('.menu-card');

        menuCards.forEach(card => {
            card.addEventListener('click', () => {
                const route = card.dataset.route;

                this.navigateTo(route);
            });
        });
    }

    // =========================================================
    // RENDER
    // =========================================================
    // Oculta las tarjetas a las que el usuario no puede entrar y las
    // secciones que quedan vacías. Hay que volver a llamarlo cada vez
    // que se muestra el menú, porque el elemento se crea antes del login.
    aplicarPermisos() {
        this.querySelectorAll('.menu-card').forEach(card => {
            card.hidden = !AuthService.puedeAcceder(card.dataset.route);
        });

        this.querySelectorAll('.menu-section').forEach(section => {
            section.hidden = !section.querySelector('.menu-card:not([hidden])');
        });

        // El navbar del menú se construyó antes del login,
        // así que se recalculan también sus opciones.
        const navbar = this.querySelector('app-navbar');

        if (navbar && navbar.aplicarPermisos) {
            navbar.aplicarPermisos();
        }
    }

    // =========================================================
    // ACCIONES
    // =========================================================
    // Pide a navegacion.js que muestre otra pantalla
    navigateTo(route) {

        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: {
                    route: route
                },
                bubbles: true
            })
        );
    }
}

// Registro del Web Component
customElements.define('app-menu', AppMenu);
