class AppMenu extends HTMLElement {

    constructor() {
        super();
    }

    async connectedCallback() {

        try {

            // 1. Cargar HTML
            const response = await fetch(
                'components/menu/menu.html'
            );

            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar la vista del menú.'
                );
            }

            const htmlContent =
                await response.text();


            // 2. Insertar CSS + HTML
            this.innerHTML = `
                <link
                    rel="stylesheet"
                    href="components/menu/menu.css"
                >

                ${htmlContent}
            `;

            // 3. Inicializar eventos
            this.initEvents();

        } catch (error) {

            console.error(
                'Error al inicializar <app-menu>:',
                error
            );

        }

    }


    initEvents() {

        // TARJETAS DEL MENÚ
        const menuCards =
            this.querySelectorAll(
                '.menu-card'
            );

        menuCards.forEach(card => {

            card.addEventListener(
                'click',
                () => {

                    const route =
                        card.dataset.route;

                    this.navigateTo(route);

                }
            );

        });

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

}

// Registro del Web Component
customElements.define('app-menu', AppMenu);