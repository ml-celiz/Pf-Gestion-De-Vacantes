class AppFooter extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/footer/footer.css');

            // 1. Descargar la plantilla HTML
            const response = await fetch('components/footer/footer.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista del footer.');
            }

            const htmlContent = await response.text();

            // 2. Insertar el HTML (sus estilos ya están cargados)
            await estilos;

            this.innerHTML = htmlContent;
        } catch (error) {
            console.error('Error al inicializar <app-footer>:', error);
        }
    }
}

// Registro del elemento personalizado
customElements.define('app-footer', AppFooter);
