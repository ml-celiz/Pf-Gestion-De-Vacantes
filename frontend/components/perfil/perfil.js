/*
* MI PERFIL
* Se abre como dialog desde el menú "Mi cuenta" del navbar:
*     document.body.appendChild(document.createElement('app-perfil'));
* Al cerrarse, el elemento se elimina solo.
*/
class PerfilComponent extends HTMLElement {
    constructor() {
        super();

        this.usuario = null;
        this.dialog = null;
    }

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================
    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/perfil/perfil.css');
            const response = await fetch('components/perfil/perfil.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar la plantilla HTML');
            }

            await estilos;

            this.innerHTML = await response.text();

            this.dialog = this.querySelector('dialog');

            this.querySelector('#btn-perfil-cerrar')
                .addEventListener('click', () => this.dialog.close());

            // Al cerrar (botón, Esc o "Cerrar") se descarta el componente
            this.dialog.addEventListener('close', () => this.remove(), { once: true });

            this.dialog.showModal();

            await this.cargarPerfil();
        } catch (error) {
            console.error('Error inicializando el componente de perfil:', error);

            this.remove();
        }
    }

    // =========================================================
    // CARGAR PERFIL
    // GET /api/usuarios/{id}
    // =========================================================
    async cargarPerfil() {
        const sesion = AuthService.getUser();

        if (!sesion || !sesion.id) {
            this.renderError('No se pudo identificar al usuario de la sesión.');

            return;
        }

        try {
            this.usuario =
                await ApiClient.get(`/usuarios/${sesion.id}`);

            this.renderDatos();
        } catch (error) {
            console.error('Error cargando el perfil:', error);

            this.renderError(error.message || 'No se pudieron cargar tus datos.');
        }
    }

    // =========================================================
    // VISTA: DATOS
    // =========================================================
    renderDatos() {
        const usuario = this.usuario;
        const nombre = usuario.nombre || '';
        const apellido = usuario.apellido || '';
        const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ') || 'Sin nombre';
        const iniciales = (nombre.charAt(0) + apellido.charAt(0)).toUpperCase() || '?';
        const roles = AuthService.getRoles();

        // Solo los postulantes cargan CV (el backend también lo exige)
        const esPostulante = roles.includes('pos');

        this.setTitulo('Mi perfil');

        this.setContenido(`
            <div class="perfil-identidad">
                <div class="perfil-avatar">${this.escapeHtml(iniciales)}</div>

                <div class="perfil-identidad-datos">
                    <h3 class="perfil-nombre">${this.escapeHtml(nombreCompleto)}</h3>
                    <span class="perfil-email">${this.escapeHtml(usuario.email || '-')}</span>

                    <div class="perfil-roles">
                        ${
                            roles.length
                                ? roles.map(rol => `
                                    <span class="perfil-rol-badge">${this.escapeHtml(rol)}</span>
                                `).join('')
                                : '<span class="perfil-rol-badge">sin rol</span>'
                        }
                    </div>
                </div>
            </div>

            <div class="perfil-datos">
                ${this.renderDato('Nombre', nombre || '-')}

                ${this.renderDato('Apellido', apellido || '-')}

                ${this.renderDato('Correo electrónico', usuario.email || '-')}

                ${this.renderDato('DNI', usuario.dni ?? '-')}

                ${this.renderDato('Teléfono', usuario.telefono || '-')}

                <div class="perfil-dato">
                    <span class="perfil-dato-label">Miembro desde</span>
                    <span class="perfil-dato-valor">
                        ${this.formatearFecha(usuario.fecha_alta)}
                    </span>
                </div>
            </div>

            ${esPostulante ? this.renderCv() : ''}
        `);

        if (esPostulante) {
            this.configurarCv();
        }

        const acciones = this.setAcciones(`
            <button type="button" class="app-btn app-btn-danger-outline" id="btn-perfil-eliminar">
                <i class="bi bi-trash-fill"></i>
                Eliminar mi cuenta
            </button>

            <span class="app-dialog-spacer"></span>

            <button type="button" class="app-btn app-btn-primary" id="btn-perfil-editar">
                <i class="bi bi-pencil-fill"></i>
                Editar mis datos
            </button>
        `);

        acciones
            .querySelector('#btn-perfil-editar')
            .addEventListener('click', () => this.renderEditar());

        acciones
            .querySelector('#btn-perfil-eliminar')
            .addEventListener('click', () => this.abrirDialogoEliminar());
    }

    renderDato(label, valor) {
        return `
            <div class="perfil-dato">
                <span class="perfil-dato-label">${label}</span>
                <span class="perfil-dato-valor">${this.escapeHtml(valor)}</span>
            </div>
        `;
    }

    // =========================================================
    // CV (solo postulantes)
    // POST / GET / DELETE /api/usuarios/{id}/cv
    // Un único PDF por usuario; "Ver CV" lo descarga.
    // =========================================================
    static CV_MAX_BYTES = 5 * 1024 * 1024;   // mismo límite que el backend

    renderCv() {
        const tieneCv = Boolean(this.usuario.tiene_cv);

        return `
            <div class="perfil-cv">
                <div class="perfil-cv-info">
                    <span class="perfil-cv-icono ${tieneCv ? 'cargado' : ''}">
                        <i class="bi ${tieneCv ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-arrow-up'}"></i>
                    </span>

                    <div>
                        <span class="perfil-dato-label">Curriculum vitae</span>
                        <p class="perfil-cv-estado">
                            ${tieneCv
                                ? 'Tu CV está cargado.'
                                : 'Todavía no cargaste tu CV. Es un único PDF de hasta 5 MB.'}
                        </p>
                    </div>
                </div>

                <div class="perfil-cv-acciones">
                    ${tieneCv ? `
                        <button type="button" class="app-btn app-btn-secondary" data-cv="ver">
                            <i class="bi bi-download"></i>
                            Ver CV
                        </button>
                        <button type="button" class="app-btn app-btn-secondary" data-cv="cargar">
                            <i class="bi bi-arrow-repeat"></i>
                            Reemplazar
                        </button>
                        <button type="button" class="app-btn app-btn-danger-outline" data-cv="eliminar"
                            title="Eliminar CV" aria-label="Eliminar CV">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    ` : `
                        <button type="button" class="app-btn app-btn-primary" data-cv="cargar">
                            <i class="bi bi-upload"></i>
                            Cargar CV
                        </button>
                    `}
                </div>

                <input type="file" id="perfil-cv-archivo" accept="application/pdf,.pdf" hidden>
            </div>
        `;
    }

    configurarCv() {
        const seccion = this.querySelector('.perfil-cv');
        const inputArchivo = seccion.querySelector('#perfil-cv-archivo');

        seccion.querySelectorAll('[data-cv]').forEach(boton => {
            boton.addEventListener('click', () => {
                switch (boton.dataset.cv) {
                    case 'ver':
                        this.descargarCv(boton);
                        break;
                    case 'cargar':
                        inputArchivo.click();
                        break;
                    case 'eliminar':
                        this.abrirDialogoEliminarCv();
                        break;
                }
            });
        });

        inputArchivo.addEventListener('change', () => {
            const archivo = inputArchivo.files[0];

            inputArchivo.value = '';   // permite volver a elegir el mismo archivo

            if (archivo) this.subirCv(archivo);
        });
    }

    async subirCv(archivo) {
        // Validación rápida; la definitiva la hace el backend
        const esPdf = archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);

        if (!esPdf) {
            this.mostrarSnackbar('El CV tiene que ser un archivo PDF.', 'error');
            return;
        }

        if (archivo.size > PerfilComponent.CV_MAX_BYTES) {
            this.mostrarSnackbar('El CV no puede superar los 5 MB.', 'error');
            return;
        }

        const reemplaza = Boolean(this.usuario.tiene_cv);
        const botones = this.querySelectorAll('.perfil-cv [data-cv]');
        botones.forEach(boton => (boton.disabled = true));

        try {
            const datos = new FormData();
            datos.append('cv', archivo);

            await ApiClient.upload(`/usuarios/${this.usuario.id}/cv`, datos);

            await this.cargarPerfil();
            this.mostrarSnackbar(reemplaza ? 'Tu CV se reemplazó correctamente.' : 'Tu CV se cargó correctamente.');
        } catch (error) {
            console.error('Error subiendo el CV:', error);
            this.mostrarSnackbar(error.message || 'No se pudo cargar el CV.', 'error');
            botones.forEach(boton => (boton.disabled = false));
        }
    }

    async descargarCv(boton) {
        boton.disabled = true;

        try {
            await ApiClient.download(`/usuarios/${this.usuario.id}/cv`, 'CV.pdf');
        } catch (error) {
            console.error('Error descargando el CV:', error);
            this.mostrarSnackbar(error.message || 'No se pudo descargar el CV.', 'error');
        } finally {
            boton.disabled = false;
        }
    }

    abrirDialogoEliminarCv() {
        const dialog = document.createElement('dialog');

        dialog.className = 'app-dialog perfil-confirm-dialog';
        dialog.innerHTML = `
            <div class="app-dialog-header">
                <h2>Eliminar CV</h2>
            </div>

            <div class="app-dialog-body">
                <p>¿Seguro que querés eliminar tu CV?</p>
                <p>Quienes evalúan tus postulaciones ya no van a poder descargarlo hasta que cargues uno nuevo.</p>
                <p class="app-dialog-error" role="alert" hidden></p>
            </div>

            <div class="app-dialog-actions">
                <button type="button" class="app-btn app-btn-secondary dialog-cancel">Cancelar</button>
                <button type="button" class="app-btn app-btn-danger dialog-confirm-delete">
                    <i class="bi bi-trash-fill"></i>
                    Eliminar CV
                </button>
            </div>
        `;

        document.body.appendChild(dialog);

        const btnCancelar = dialog.querySelector('.dialog-cancel');
        const btnEliminar = dialog.querySelector('.dialog-confirm-delete');
        const mensajeError = dialog.querySelector('.app-dialog-error');

        btnCancelar.addEventListener('click', () => dialog.close());

        btnEliminar.addEventListener('click', async () => {
            mensajeError.hidden = true;
            btnEliminar.disabled = true;
            btnCancelar.disabled = true;

            try {
                await ApiClient.delete(`/usuarios/${this.usuario.id}/cv`);

                dialog.close();
                await this.cargarPerfil();
                this.mostrarSnackbar('Tu CV se eliminó correctamente.');
            } catch (error) {
                console.error('Error eliminando el CV:', error);

                mensajeError.textContent = error.message || 'No se pudo eliminar el CV.';
                mensajeError.hidden = false;
                btnEliminar.disabled = false;
                btnCancelar.disabled = false;
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });
        dialog.showModal();
    }

    renderError(mensaje) {
        this.setContenido(`
            <div class="perfil-error">
                <i class="bi bi-exclamation-circle"></i>
                <p>${this.escapeHtml(mensaje)}</p>
            </div>
        `);

        this.setAcciones(null);
    }

    // =========================================================
    // VISTA: EDITAR
    // PUT /api/usuarios/{id}
    // Reemplaza el contenido del mismo dialog; "Cancelar"
    // vuelve a la vista de datos.
    // =========================================================
    renderEditar() {
        const usuario = this.usuario;

        this.setTitulo('Editar mis datos');

        this.setContenido(`
            <form id="perfil-form" class="perfil-form" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="perfil-nombre">Nombre</label>

                        <input
                            type="text"
                            id="perfil-nombre"
                            class="form-control"
                            value="${this.escapeHtml(usuario.nombre || '')}"
                            required>
                    </div>

                    <div class="form-group">
                        <label for="perfil-apellido">Apellido</label>

                        <input
                            type="text"
                            id="perfil-apellido"
                            class="form-control"
                            value="${this.escapeHtml(usuario.apellido || '')}"
                            required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="perfil-email">Correo electrónico</label>

                    <input
                        type="email"
                        id="perfil-email"
                        class="form-control"
                        value="${this.escapeHtml(usuario.email || '')}"
                        required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="perfil-dni">DNI</label>

                        <input
                            type="text"
                            inputmode="numeric"
                            id="perfil-dni"
                            class="form-control"
                            value="${this.escapeHtml(usuario.dni ?? '')}">
                    </div>

                    <div class="form-group">
                        <label for="perfil-telefono">Teléfono</label>

                        <input
                            type="text"
                            id="perfil-telefono"
                            class="form-control"
                            value="${this.escapeHtml(usuario.telefono || '')}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="perfil-contrasena-actual">Contraseña actual</label>
                        <input type="password" id="perfil-contrasena-actual" class="form-control"
                            autocomplete="current-password" placeholder="••••••••">
                    </div>

                    <div class="form-group">
                        <label for="perfil-contrasena">Nueva contraseña</label>
                        <input type="password" id="perfil-contrasena" class="form-control"
                            autocomplete="new-password" placeholder="••••••••">
                    </div>
                </div>
                <small class="form-help perfil-form-ayuda">
                    Para cambiar la contraseña completá los dos campos. Si los dejás vacíos,
                    se conserva la actual.
                </small>

                <p class="app-dialog-error" role="alert" hidden></p>
            </form>
        `);

        const acciones = this.setAcciones(`
            <button type="button" class="app-btn app-btn-secondary" id="btn-perfil-cancelar">
                Cancelar
            </button>

            <button
                type="submit"
                form="perfil-form"
                class="app-btn app-btn-primary"
                id="btn-perfil-guardar">
                Guardar
            </button>
        `);

        const form = this.querySelector('#perfil-form');
        const mensajeError = form.querySelector('.app-dialog-error');
        const btnCancelar = acciones.querySelector('#btn-perfil-cancelar');
        const btnGuardar = acciones.querySelector('#btn-perfil-guardar');

        const mostrarError = mensaje => {
            mensajeError.textContent = mensaje;
            mensajeError.hidden = false;
        };

        btnCancelar.addEventListener('click', () => this.renderDatos());

        form.addEventListener('submit', async event => {
            event.preventDefault();

            mensajeError.hidden = true;

            const nombre = form.querySelector('#perfil-nombre');
            const apellido = form.querySelector('#perfil-apellido');
            const email = form.querySelector('#perfil-email');
            const dni = form.querySelector('#perfil-dni');
            const telefono = form.querySelector('#perfil-telefono');
            const contrasena = form.querySelector('#perfil-contrasena');
            const contrasenaActual = form.querySelector('#perfil-contrasena-actual');

            if (!nombre.value.trim()) {
                mostrarError('El nombre es obligatorio.');
                nombre.focus();
                return;
            }

            if (!apellido.value.trim()) {
                mostrarError('El apellido es obligatorio.');
                apellido.focus();
                return;
            }

            if (!email.value.trim() || !email.checkValidity()) {
                mostrarError('Ingresá un correo electrónico válido.');
                email.focus();
                return;
            }

            if (dni.value.trim() && !/^\d+$/.test(dni.value.trim())) {
                mostrarError('El DNI debe contener solo números.');
                dni.focus();
                return;
            }

            if (contrasenaActual.value && !contrasena.value) {
                mostrarError('Ingresá la nueva contraseña.');
                contrasena.focus();
                return;
            }

            if (contrasena.value && !contrasenaActual.value) {
                mostrarError('Ingresá tu contraseña actual para cambiarla.');
                contrasenaActual.focus();
                return;
            }

            if (contrasena.value && contrasena.value.length < 8) {
                mostrarError('La nueva contraseña debe tener al menos 8 caracteres.');
                contrasena.focus();
                return;
            }

            if (contrasena.value && contrasena.value === contrasenaActual.value) {
                mostrarError('La nueva contraseña tiene que ser distinta de la actual.');
                contrasena.focus();
                return;
            }

            btnGuardar.disabled = true;
            btnCancelar.disabled = true;

            try {
                const datos = {
                    nombre: nombre.value.trim(),
                    apellido: apellido.value.trim(),
                    email: email.value.trim(),
                    dni: dni.value.trim() || null,
                    telefono: telefono.value.trim() || null
                };

                // Solo se envía si se quiere cambiar
                if (contrasena.value) {
                    datos.contrasena = contrasena.value;
                    datos.contrasena_actual = contrasenaActual.value;
                }

                await ApiClient.put(
                    `/usuarios/${this.usuario.id}`,
                    datos
                );

                await this.cargarPerfil();

                this.mostrarSnackbar('Tus datos se actualizaron correctamente.');
            } catch (error) {
                console.error('Error actualizando el perfil:', error);

                mostrarError(error.message || 'No se pudieron guardar los cambios.');

                btnGuardar.disabled = false;
                btnCancelar.disabled = false;
            }
        });

        form.querySelector('#perfil-nombre').focus();
    }

    // =========================================================
    // DIALOG: ELIMINAR CUENTA
    // DELETE /api/usuarios/{id}
    // Confirmación en un segundo dialog, encima del perfil.
    // =========================================================
    abrirDialogoEliminar() {
        const dialog = document.createElement('dialog');

        dialog.className = 'app-dialog perfil-confirm-dialog';

        dialog.innerHTML = `
            <div class="app-dialog-header">
                <h2>Eliminar mi cuenta</h2>
            </div>

            <div class="app-dialog-body">
                <p>
                    ¿Seguro que querés eliminar tu cuenta
                    <strong>${this.escapeHtml(this.usuario.email || '')}</strong>?
                </p>

                <p>
                    Se cerrará tu sesión y no vas a poder volver a ingresar
                    ni seguir tus postulaciones.
                </p>

                <p class="app-dialog-error" role="alert" hidden></p>
            </div>

            <div class="app-dialog-actions">
                <button type="button" class="app-btn app-btn-secondary dialog-cancel">
                    Cancelar
                </button>

                <button type="button" class="app-btn app-btn-danger dialog-confirm-delete">
                    Eliminar cuenta
                </button>
            </div>
        `;

        document.body.appendChild(dialog);

        const btnCancelar = dialog.querySelector('.dialog-cancel');
        const btnEliminar = dialog.querySelector('.dialog-confirm-delete');
        const mensajeError = dialog.querySelector('.app-dialog-error');

        btnCancelar.addEventListener('click', () => dialog.close());

        btnEliminar.addEventListener('click', async () => {
            mensajeError.hidden = true;

            btnEliminar.disabled = true;
            btnCancelar.disabled = true;

            try {
                await ApiClient.delete(
                    `/usuarios/${this.usuario.id}`
                );

                dialog.close();

                // La cuenta ya no existe: cerrar sesión
                await AuthService.logout();
            } catch (error) {
                console.error('Error eliminando la cuenta:', error);

                mensajeError.textContent = error.message || 'No se pudo eliminar la cuenta.';

                mensajeError.hidden = false;

                btnEliminar.disabled = false;
                btnCancelar.disabled = false;
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();
    }

    // =========================================================
    // PARTES DEL DIALOG
    // =========================================================
    setTitulo(titulo) {
        const h2 = this.querySelector('#perfil-dialog-titulo');

        if (h2) h2.textContent = titulo;
    }

    setContenido(html) {
        const contenedor = this.querySelector('#perfil-contenido');

        if (contenedor) {
            contenedor.innerHTML = html;
            contenedor.scrollTop = 0;
        }
    }

    // Sin html se ocultan las acciones
    setAcciones(html) {
        const acciones = this.querySelector('#perfil-acciones');

        if (!acciones) return null;

        acciones.innerHTML = html || '';
        acciones.hidden = !html;

        return acciones;
    }

    // =========================================================
    // SNACKBAR
    // =========================================================
    mostrarSnackbar(mensaje, tipo = 'success') {
        const anterior = document.querySelector('.perfil-snackbar');

        if (anterior) anterior.remove();

        const snackbar = document.createElement('div');

        snackbar.className =
            `app-snackbar perfil-snackbar app-snackbar-${tipo}`;

        snackbar.innerHTML = `
            <i class="bi ${
                tipo === 'success'
                    ? 'bi-check-circle-fill'
                    : 'bi-exclamation-circle-fill'
            }"></i>

            <span>${this.escapeHtml(mensaje)}</span>
        `;

        // Dentro del dialog para que quede por encima del fondo modal
        (this.dialog && this.dialog.open ? this.dialog : document.body)
            .appendChild(snackbar);

        requestAnimationFrame(() => {
            snackbar.classList.add('show');
        });

        setTimeout(() => {
            snackbar.classList.remove('show');

            setTimeout(() => snackbar.remove(), 300);
        }, 3000);
    }

    // =========================================================
    // UTILIDADES
    // =========================================================
    formatearFecha(fecha) {
        if (!fecha) return '-';

        const valor = String(fecha);

        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            const [year, month, day] = valor.split('-');
            return `${day}/${month}/${year}`;
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return this.escapeHtml(valor);
        }

        return date.toLocaleDateString('es-AR');
    }

    escapeHtml(valor) {
        if (valor === null || valor === undefined) {
            return '';
        }

        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// =============================================================
// REGISTRAR COMPONENTE
// =============================================================
customElements.define('app-perfil', PerfilComponent);
