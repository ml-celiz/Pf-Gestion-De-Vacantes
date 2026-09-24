/*
* PREGUNTAS FRECUENTES
* Se abre como dialog desde el menú "Mi cuenta" del navbar:
*     document.body.appendChild(document.createElement('app-faq'));
* Al cerrarse, el elemento se elimina solo.
*/
class FaqComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/faq/faq.css');
            const response = await fetch('components/faq/faq.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la plantilla HTML');
            }

            await estilos;

            this.innerHTML = await response.text();

            const dialog = this.querySelector('dialog');

            ['#btn-faq-cerrar', '#btn-faq-entendido'].forEach(selector => {
                this.querySelector(selector)
                    .addEventListener('click', () => dialog.close());
            });

            // Al cerrar (botones o Esc) se descarta el componente
            dialog.addEventListener('close', () => this.remove(), { once: true });

            dialog.showModal();
        } catch (error) {
            console.error('Error inicializando el componente de FAQ:', error);

            this.remove();
        }
    }
}

// =============================================================
// REGISTRAR COMPONENTE
// =============================================================
customElements.define('app-faq', FaqComponent);
