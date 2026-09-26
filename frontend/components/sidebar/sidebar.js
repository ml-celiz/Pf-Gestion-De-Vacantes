/*
* MENÚ LATERAL
* Una sola instancia para toda la aplicación (en index.html). Se abre
* y se cierra con el botón ☰ del navbar (evento 'alternar-sidebar')
* y aparece debajo del navbar, que sigue visible.
*
* Muestra solo las pantallas a las que el rol puede entrar (las mismas
* reglas que el menú principal: AuthService.puedeAcceder) y oculta las
* secciones que quedan vacías. Se arma cada vez que se abre, así
* siempre refleja la sesión actual.
*/
class AppSidebar extends HTMLElement {
    static VERSION = '1.0.0';

    // Mismas secciones, nombres e íconos que el menú principal
    static SECCIONES = [
        {
            titulo: 'Paneles',
            items: [
                { ruta: 'vacantes', texto: 'Vacantes', icono: 'bi-briefcase' },
                { ruta: 'postulaciones', texto: 'Postulaciones', icono: 'bi-file-earmark-check' }
            ]
        },
        {
            titulo: 'Configuraciones',
            items: [
                { ruta: 'gestion-vacantes', texto: 'Gestión de vacantes', icono: 'bi-briefcase-fill' }
            ]
        },
        {
            titulo: 'Usuarios',
            items: [
                { ruta: 'roles', texto: 'Roles', icono: 'bi-people' },
                { ruta: 'usuarios', texto: 'Usuarios', icono: 'bi-person-gear' }
            ]
        }
    ];

    constructor() {
        super();

        this.alPresionarTecla = this.alPresionarTecla.bind(this);
    }

    async connectedCallback() {
        try {
            const estilos = cargarEstilos('components/sidebar/sidebar.css');
            const response = await fetch('components/sidebar/sidebar.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la vista del menú lateral.');
            }

            const html = await response.text();

            await estilos;

            this.innerHTML = html;
            this.panel = this.querySelector('.sidebar');

            this.querySelector('.sidebar-overlay').addEventListener('click', () => this.cerrar());
            this.querySelector('.sidebar-cerrar').addEventListener('click', () => this.cerrar());
            this.querySelector('.sidebar-salir').addEventListener('click', () => this.salir());

            this.querySelector('.sidebar-nav').addEventListener('click', event => {
                const item = event.target.closest('[data-route]');
                if (item) this.navegar(item.dataset.route);
            });

            // Botón ☰ del navbar: abre o cierra
            document.addEventListener('alternar-sidebar', () => {
                this.classList.contains('abierto') ? this.cerrar() : this.abrir();
            });

            // Si la sesión se cae, el menú no puede quedar abierto sobre el login
            document.addEventListener('auth-expired', () => this.cerrar());

            // El desplegable "Mi cuenta" del navbar quedaría debajo del fondo oscuro
            document.addEventListener('show.bs.dropdown', () => this.cerrar());
        } catch (error) {
            console.error('Error al inicializar <app-sidebar>:', error);
        }
    }

    // =========================================================
    // ABRIR / CERRAR
    // =========================================================
    abrir() {
        if (!this.panel) return;

        this.render();

        this.classList.add('abierto');
        this.panel.inert = false;
        this.marcarBotones(true);

        document.addEventListener('keydown', this.alPresionarTecla);

        // El foco va al panel (no a un ítem): el teclado arranca desde el
        // menú sin que un ítem quede marcado con el anillo de foco
        this.panel.focus();
    }

    cerrar() {
        if (!this.panel || !this.classList.contains('abierto')) return;

        this.classList.remove('abierto');
        this.panel.inert = true;
        this.marcarBotones(false);

        document.removeEventListener('keydown', this.alPresionarTecla);
    }

    // Estado del botón ☰ (hay uno en el navbar de cada vista)
    marcarBotones(abierto) {
        document.querySelectorAll('.btn-sidebar-navbar').forEach(boton => {
            boton.setAttribute('aria-expanded', String(abierto));
            boton.classList.toggle('activo', abierto);
        });
    }

    alPresionarTecla(event) {
        if (event.key === 'Escape') this.cerrar();
    }

    // =========================================================
    // CONTENIDO SEGÚN LA SESIÓN
    // =========================================================
    render() {
        const actual = typeof getRouteFromUrl === 'function' ? getRouteFromUrl() : 'menu';

        const item = ({ ruta, texto, icono }) => `
            <button type="button" class="sidebar-item ${ruta === actual ? 'activo' : ''}"
                data-route="${ruta}" ${ruta === actual ? 'aria-current="page"' : ''}>
                <i class="bi ${icono}"></i>
                <span>${texto}</span>
            </button>
        `;

        const secciones = AppSidebar.SECCIONES
            .map(seccion => ({
                ...seccion,
                items: seccion.items.filter(opcion => AuthService.puedeAcceder(opcion.ruta))
            }))
            .filter(seccion => seccion.items.length > 0)
            .map(seccion => `
                <div class="sidebar-seccion">
                    <span class="sidebar-seccion-titulo">${seccion.titulo}</span>
                    ${seccion.items.map(item).join('')}
                </div>
            `)
            .join('');

        this.querySelector('.sidebar-nav').innerHTML = `
            ${item({ ruta: 'menu', texto: 'Menú principal', icono: 'bi-house' })}
            ${secciones}
        `;

        this.renderUsuario();
        this.querySelector('.sidebar-version').textContent = `Versión ${AppSidebar.VERSION}`;
    }

    renderUsuario() {
        const esInvitado = AuthService.esInvitado();
        const usuario = AuthService.getUser() || {};
        const roles = AuthService.getRoles();

        const nombre = esInvitado
            ? 'Invitado'
            : [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email || 'Mi cuenta';

        const iniciales = esInvitado
            ? '?'
            : ((usuario.nombre || '').charAt(0) + (usuario.apellido || '').charAt(0)).toUpperCase() || '?';

        this.querySelector('.sidebar-avatar').textContent = iniciales;
        this.querySelector('.sidebar-usuario-nombre').textContent = nombre;
        this.querySelector('.sidebar-usuario-rol').textContent =
            esInvitado ? 'Sin cuenta' : roles.join(' · ') || 'Sin rol';

        const salir = this.querySelector('.sidebar-salir');
        const textoSalir = esInvitado ? 'Salir del modo invitado' : 'Cerrar sesión';

        salir.title = textoSalir;
        salir.setAttribute('aria-label', textoSalir);
    }

    // =========================================================
    // ACCIONES
    // =========================================================
    navegar(ruta) {
        this.cerrar();

        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { route: ruta },
            bubbles: true
        }));
    }

    async salir() {
        this.cerrar();

        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}

customElements.define('app-sidebar', AppSidebar);
