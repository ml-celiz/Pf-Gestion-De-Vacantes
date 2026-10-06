/*
* PÁGINA NO ENCONTRADA (404)
* Se muestra cuando la dirección tiene una ruta que no existe
* (por ejemplo, un #/paneles/... mal escrito). Explica el error y
* ofrece volver al menú principal.
*/
class AppNoEncontrada extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/no-encontrada/no-encontrada.css');

            const response = await fetch('components/no-encontrada/no-encontrada.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista de página no encontrada.');
            }

            const htmlContent = await response.text();

            await estilos;

            this.innerHTML = htmlContent;

            this.querySelector('#btn-volver-menu').addEventListener('click', () => {
                this.dispatchEvent(
                    new CustomEvent('navigate', {
                        detail: {
                            route: 'menu'
                        },
                        bubbles: true
                    })
                );
            });
        } catch (error) {
            console.error('Error al inicializar <app-no-encontrada>:', error);
        }
    }
}

// Registro del Web Component
customElements.define('app-no-encontrada', AppNoEncontrada);
