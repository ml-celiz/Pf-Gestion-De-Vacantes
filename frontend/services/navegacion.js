/*
* NAVEGACIÓN ENTRE VISTAS (SPA)
* index.html tiene un contenedor por pantalla (#login-view, #menu-view,
* #vacantes-view...). Este archivo decide cuál se muestra:
*   - evento 'navigate' { route }: lo disparan el menú, el navbar y el sidebar.
*   - botón atrás/adelante del navegador (popstate).
*   - al cargar la página: restaura la sesión guardada o muestra el login.
*   - eventos de sesión: 'auth-expired', 'modo-invitado', 'crear-cuenta'.
* La URL usa hash (#/paneles/vacantes) para que F5 vuelva a la misma pantalla.
*/

// Ruta interna -> hash de la URL ('' = menú principal)
const RUTAS_HASH = {
    menu: '',
    vacantes: '#/paneles/vacantes',
    postulaciones: '#/paneles/postulaciones',
    'gestion-vacantes': '#/configuraciones/gestion-vacantes',
    roles: '#/usuarios/roles',
    usuarios: '#/usuarios/usuarios'
};

// Pantallas que se crean de nuevo en cada entrada (así vuelven a pedir los
// datos a la API y reflejan los cambios hechos en otras pantallas)
const VISTAS_DINAMICAS = {
    vacantes: 'app-vacantes',
    postulaciones: 'app-postulaciones',
    'gestion-vacantes': 'app-gestion-vacantes',
    roles: 'app-roles',
    usuarios: 'app-usuarios',
    'no-encontrada': 'app-no-encontrada'
};

// =========================================================
// UTILIDADES DE VISTAS
// =========================================================

function todasLasVistas() {
    return document.querySelectorAll('[id$="-view"]');
}

function ocultarTodasLasVistas() {
    todasLasVistas().forEach(vista => {
        vista.style.display = 'none';
    });
}

// Muestra el login (sesión vencida, logout, crear cuenta)
function mostrarLogin() {
    ocultarTodasLasVistas();
    document.getElementById('login-view').style.display = 'block';
}

// Deja la URL sin hash ni parámetros
function limpiarUrl(reemplazar = false) {
    const metodo = reemplazar ? 'replaceState' : 'pushState';
    window.history[metodo]({}, '', window.location.pathname);
}

/*
* Los paneles arman sus botones según el rol. Al cambiar de usuario
* (login, logout, modo invitado) se vacían sus vistas para que no quede
* nada del usuario anterior.
*/
function limpiarVistasDinamicas() {
    todasLasVistas().forEach(vista => {
        // login-view y menu-view tienen su contenido fijo en el HTML
        if (vista.id !== 'login-view' && vista.id !== 'menu-view') {
            vista.innerHTML = '';
        }
    });

    // Dialogs de la cuenta que hayan quedado abiertos
    document.querySelectorAll('app-perfil, app-faq').forEach(dialogo => dialogo.remove());
}

/*
* El login y el menú quedan siempre en el DOM, y el HTML no admite más de
* un <main> visible: el <main> de cada vista oculta lleva "hidden". Se
* vuelve a calcular ante cualquier cambio de vista.
*/
function sincronizarMain() {
    todasLasVistas().forEach(vista => {
        const oculta = vista.style.display === 'none';

        vista.querySelectorAll('main').forEach(main => {
            if (main.hidden !== oculta) main.hidden = oculta;
        });
    });
}

new MutationObserver(sincronizarMain).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style']
});

// Ruta interna según el hash actual. Sin hash: menú; hash desconocido: 404
function getRouteFromUrl() {
    const hash = window.location.hash;

    if (!hash || hash === '#' || hash === '#/') return 'menu';

    const ruta = Object.keys(RUTAS_HASH).find(clave => RUTAS_HASH[clave] === hash);

    return ruta || 'no-encontrada';
}

function navegar(route) {
    document.dispatchEvent(new CustomEvent('navigate', { detail: { route } }));
}

// =========================================================
// NAVEGACIÓN
// =========================================================
document.addEventListener('navigate', (event) => {
    let route = event.detail.route;

    // Sin permiso para esa pantalla (por ejemplo, una URL escrita a mano): al menú
    if (!AuthService.puedeAcceder(route)) {
        console.warn('Sin permiso para la ruta:', route);
        route = 'menu';
    }

    // Actualizar la URL (la 404 deja la URL como estaba, para ver qué falló)
    const nuevoHash = RUTAS_HASH[route];

    if (nuevoHash !== undefined && window.location.hash !== nuevoHash) {
        window.history.pushState({ route }, '', nuevoHash || window.location.pathname);
    }

    ocultarTodasLasVistas();

    // Menú: queda fijo en el DOM, solo se actualizan sus tarjetas
    if (route === 'menu') {
        const menuView = document.getElementById('menu-view');
        const menu = menuView.querySelector('app-menu');

        menuView.style.display = 'block';

        if (menu && menu.aplicarPermisos) menu.aplicarPermisos();
        return;
    }

    const etiqueta = VISTAS_DINAMICAS[route];
    const vista = document.getElementById(`${route}-view`);

    if (!etiqueta || !vista) {
        console.warn('Ruta no implementada:', route);
        return;
    }

    vista.innerHTML = `<${etiqueta}></${etiqueta}>`;
    vista.style.display = 'block';
});

// Botón atrás / adelante del navegador
window.addEventListener('popstate', () => navegar(getRouteFromUrl()));

// =========================================================
// INICIO: RESTAURAR SESIÓN
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('app-loader');

    // Link del correo de recuperación (?restablecer=TOKEN):
    // se abre el formulario de nueva contraseña del login
    const tokenRestablecer = new URLSearchParams(window.location.search).get('restablecer');

    if (tokenRestablecer) {
        // El token no queda en la barra de direcciones ni en el historial
        limpiarUrl(true);
        loader.hidden = true;
        document.getElementById('login-view').style.display = 'block';
        document.querySelector('app-login').abrirRestablecer(tokenRestablecer);
        return;
    }

    const tieneSesion = await AuthService.restoreSession();

    // Recién ahora se sabe qué mostrar: hasta acá solo se vio el indicador
    // de carga (así el login no aparece un instante antes que el menú)
    loader.hidden = true;

    if (tieneSesion) {
        navegar(getRouteFromUrl());
        return;
    }

    // Si quedó un hash de una pantalla interna, limpiarlo
    if (window.location.hash) limpiarUrl(true);

    document.getElementById('login-view').style.display = 'block';
});

// =========================================================
// EVENTOS DE SESIÓN
// =========================================================

// Sesión expirada (la API respondió 401): volver al login
document.addEventListener('auth-expired', () => {
    limpiarVistasDinamicas();
    mostrarLogin();
    limpiarUrl();
});

// Modo invitado: navegación sin cuenta, solo el panel de vacantes
document.addEventListener('modo-invitado', async () => {
    // Trae los permisos del rol `inv` antes de mostrar el panel
    await AuthService.entrarModoInvitado();
    limpiarVistasDinamicas();
    navegar('vacantes');
});

// Crear cuenta (o iniciar sesión) desde el modo invitado
document.addEventListener('crear-cuenta', (event) => {
    // modo: 'registro' (por defecto) o 'login'
    const modo = (event.detail && event.detail.modo) || 'registro';

    // Salir del modo invitado y volver al login
    AuthService.clearSession();
    limpiarVistasDinamicas();
    mostrarLogin();

    const login = document.querySelector('#login-view app-login');

    if (login) {
        if (modo === 'login' && login.mostrarLogin) {
            login.mostrarLogin();
        } else if (login.mostrarRegistro) {
            login.mostrarRegistro();
        }
    }

    limpiarUrl();
});
