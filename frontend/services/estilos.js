/*
* Carga la hoja de estilos de un componente en el <head> (una sola vez)
* y devuelve una promesa que se resuelve cuando ya está aplicada.
*
* Los componentes la esperan antes de insertar su HTML; si no, el
* navegador pinta el HTML sin estilos por un instante (se veía al
* recargar el login con F5).
*/
const estilosCargados = new Map();

function cargarEstilos(href) {
    if (!estilosCargados.has(href)) {
        estilosCargados.set(href, new Promise(resolve => {
            const link = document.createElement('link');

            link.rel = 'stylesheet';
            link.href = href;

            // Si la hoja falla, el componente se muestra igual en vez de quedar vacío
            link.onload = () => resolve();
            link.onerror = () => resolve();

            document.head.appendChild(link);
        }));
    }

    return estilosCargados.get(href);
}
