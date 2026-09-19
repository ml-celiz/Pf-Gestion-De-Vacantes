class AppFooter extends HTMLElement {

    constructor() {
        super();
    }

    async connectedCallback() {

        try {

            // 1. Descargar la plantilla HTML
            const response = await fetch('components/footer/footer.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista del footer.');
            }

            const htmlContent = await response.text();

            // 2. Insertar estilos y HTML dentro del tag <app-footer>
            this.innerHTML = `
                <link rel="stylesheet" href="components/footer/footer.css">
                ${htmlContent}
            `;

        } catch (error) {

            console.error(
                'Error al inicializar <app-footer>:',
                error
            );

        }
    }
}

// Registro del elemento personalizado
customElements.define('app-footer', AppFooter);