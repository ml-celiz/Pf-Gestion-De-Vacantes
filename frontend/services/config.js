/*
* CONFIGURACIÓN DEL FRONTEND
*
* URL de la API:
*   - En local (localhost): el servidor de PHP del backend, en el puerto 8000
*     (C:\xampp\php\php.exe -S localhost:8000 main.php).
*   - En el hosting: el backend publicado en el mismo dominio, en /backend/api
*     (lo resuelve backend/.htaccess). Si se publica en otra ruta o dominio,
*     cambiar API_URL_PRODUCCION.
*/
const API_URL_PRODUCCION = `${window.location.origin}/backend/api`;

const API_BASE_URL =
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:8000/api'
        : API_URL_PRODUCCION;
