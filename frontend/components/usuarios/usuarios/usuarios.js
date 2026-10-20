/*
* COMPONENTE <app-usuarios>
* Panel de administración de usuarios: tabla paginada con alta, edición
* (datos, contraseña y rol) y baja lógica. Los botones se muestran según
* los permisos del módulo `usuarios`.
*
* Endpoints: GET/POST /api/usuarios, PUT/DELETE /api/usuarios/{id},
*            GET /api/roles, POST/DELETE /api/roles/{id}/usuarios
*/
class UsuariosComponent extends HTMLElement {

    // =========================================================
    // ESTADO
    // =========================================================
    constructor() {
        super();

        this.usuarios = [];            // filas de la tabla
        this.roles = [];               // opciones del select de rol

        this.usuariosPerPage = 10;     // paginación
        this.usuariosCurrentPage = 1;
    }

    // =========================================================
    // CICLO DE VIDA: carga el HTML y el CSS, luego los datos
    // =========================================================
    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/usuarios/usuarios/usuarios.css');
            const response = await fetch('components/usuarios/usuarios/usuarios.html');

            if (!response.ok) {
                throw new Error('Error al cargar vista de usuarios.');
            }

            const html = await response.text();

            await estilos;

            this.innerHTML = html;

            this.initEvents();

            await this.cargarUsuarios();
        } catch (error) {
            console.error('Error inicializando <app-usuarios>:', error);
        }
    }

    // =========================================================
    // EVENTOS
    // =========================================================
    initEvents() {
        const btnRefresh = this.querySelector('#btn-refresh');
        const btnAddUsuario = this.querySelector('#btn-add-usuario');
        const usuariosPrev = this.querySelector('#usuarios-prev');
        const usuariosNext = this.querySelector('#usuarios-next');

        // Refrescar la tabla
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.recargarUsuarios());
        }

        // Alta: solo si el rol puede escribir en el módulo `usuarios`
        if (btnAddUsuario) {
            btnAddUsuario.hidden = !AuthService.puede('usuarios', 'escribir');
            btnAddUsuario.addEventListener('click', () => this.abrirDialogoUsuario());
        }

        // Paginación
        if (usuariosPrev) {
            usuariosPrev.addEventListener('click', () => {
                if (this.usuariosCurrentPage > 1) {
                    this.usuariosCurrentPage--;
                    this.renderUsuarios();
                }
            });
        }

        if (usuariosNext) {
            usuariosNext.addEventListener('click', () => {
                const totalPages = Math.ceil(this.usuarios.length / this.usuariosPerPage);

                if (this.usuariosCurrentPage < totalPages) {
                    this.usuariosCurrentPage++;
                    this.renderUsuarios();
                }
            });
        }
    }

    // =========================================================
    // DATOS (API)
    // =========================================================

    // Vuelve a la primera página y recarga
    async recargarUsuarios() {
        this.usuariosCurrentPage = 1;

        await this.cargarUsuarios();
    }

    // GET /api/usuarios
    async cargarUsuarios() {
        const tbody = this.querySelector('#tb-usuarios');

        if (!tbody) {
            console.error('No se encontró #tb-usuarios');
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Cargando usuarios...</td>
            </tr>
        `;

        try {
            this.usuarios = (await ApiClient.get('/usuarios')) || [];
            this.usuariosCurrentPage = 1;

            if (this.usuarios.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted">No hay usuarios registrados.</td>
                    </tr>
                `;

                this.actualizarPaginacion();
                return;
            }

            this.renderUsuarios();
        } catch (error) {
            console.error('Error cargando usuarios:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">Error al cargar usuarios.</td>
                </tr>
            `;

            this.actualizarPaginacion();
        }
    }

    // GET /api/roles (opciones del select de rol)
    async cargarRoles() {
        this.roles = (await ApiClient.get('/roles')) || [];

        return this.roles;
    }

    // =========================================================
    // RENDER
    // =========================================================

    // Filas de la página actual, con sus botones editar / eliminar
    renderUsuarios() {
        const tbody = this.querySelector('#tb-usuarios');

        if (!tbody) return;

        tbody.innerHTML = '';

        const start = (this.usuariosCurrentPage - 1) * this.usuariosPerPage;
        const usuariosPagina = this.usuarios.slice(start, start + this.usuariosPerPage);
        const puedeEditar = AuthService.puede('usuarios', 'editar');

        usuariosPagina.forEach(usuario => {
            const tr = document.createElement('tr');

            tr.dataset.id = usuario.id;

            tr.innerHTML = `
                <td>${this.escapeHtml(usuario.nombre || '-')}</td>
                <td>${this.escapeHtml(usuario.apellido || '-')}</td>
                <td>${this.escapeHtml(usuario.email || '-')}</td>
                <td>${this.escapeHtml(usuario.rol || 'Sin rol')}</td>
                <td>${usuario.cantidad_sesiones ?? 0}</td>
                <td>${this.formatearFecha(usuario.fecha_alta)}</td>
                <td>${usuario.fecha_baja ? this.formatearFecha(usuario.fecha_baja) : '-'}</td>

                <td class="text-center">
                    <div class="action-btn-group">
                        <button class="btn-action edit" title="Editar" type="button" ${puedeEditar ? '' : 'hidden'}>
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button class="btn-action delete" title="Eliminar" type="button" ${puedeEditar ? '' : 'hidden'}>
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tr.querySelector('.btn-action.edit').addEventListener('click', (event) => {
                event.stopPropagation();
                this.abrirDialogoUsuario(usuario);
            });

            tr.querySelector('.btn-action.delete').addEventListener('click', (event) => {
                event.stopPropagation();
                this.abrirDialogoEliminarUsuario(usuario);
            });

            tbody.appendChild(tr);
        });

        this.actualizarPaginacion();
    }

    // Texto "1 - 10 de 25", número de página y botones anterior / siguiente
    actualizarPaginacion() {
        const total = this.usuarios.length;
        const totalPages = Math.max(1, Math.ceil(total / this.usuariosPerPage));

        // Evitar quedar en una página inexistente
        if (this.usuariosCurrentPage > totalPages) {
            this.usuariosCurrentPage = totalPages;
        }

        const start = total === 0 ? 0 : ((this.usuariosCurrentPage - 1) * this.usuariosPerPage) + 1;
        const end = Math.min(this.usuariosCurrentPage * this.usuariosPerPage, total);

        const info = this.querySelector('#usuarios-page-info');
        const pageNumber = this.querySelector('#usuarios-page-number');
        const prev = this.querySelector('#usuarios-prev');
        const next = this.querySelector('#usuarios-next');

        if (info) info.textContent = `${start} - ${end} de ${total}`;
        if (pageNumber) pageNumber.textContent = `Página ${this.usuariosCurrentPage} de ${totalPages}`;
        if (prev) prev.disabled = this.usuariosCurrentPage <= 1;
        if (next) next.disabled = this.usuariosCurrentPage >= totalPages;
    }

    // =========================================================
    // DIALOG: CREAR / EDITAR USUARIO
    // Sin `usuario` es un alta; con `usuario`, una edición
    // (la contraseña se puede dejar vacía para conservarla).
    // =========================================================
    async abrirDialogoUsuario(usuario = null) {
        const esEdicion = usuario !== null;
        let roles = [];

        try {
            roles = await this.cargarRoles();
        } catch (error) {
            console.error('Error cargando roles:', error);
            this.mostrarSnackbar('No se pudieron cargar los roles.', 'error');
            return;
        }

        // GET /api/usuarios devuelve el nombre del rol: se busca su id
        const rolActual = roles.find(rol =>
            (rol.nombre || '').toLowerCase() === (usuario?.rol || '').toLowerCase()
        );
        const rolActualId = rolActual ? rolActual.id : '';

        const valor = campo => this.escapeHtml(usuario?.[campo] ?? '');

        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>${esEdicion ? 'Editar usuario' : 'Agregar usuario'}</h2>
            </div>

            <form class="dialog-form usuario-dialog-form" novalidate>
                <div class="usuario-dialog-fields">
                    <div class="form-group">
                        <label for="usuario-email">Email</label>
                        <input id="usuario-email" type="email" class="form-control"
                            maxlength="50" autocomplete="off" value="${valor('email')}" required>
                    </div>

                    <div class="form-group">
                        <label for="usuario-nombre">Nombre</label>
                        <input id="usuario-nombre" type="text" class="form-control"
                            maxlength="50" autocomplete="off" value="${valor('nombre')}" required>
                    </div>

                    <div class="form-group">
                        <label for="usuario-apellido">Apellido</label>
                        <input id="usuario-apellido" type="text" class="form-control"
                            maxlength="50" autocomplete="off" value="${valor('apellido')}" required>
                    </div>

                    <div class="form-group">
                        <label for="usuario-contrasena">Contraseña</label>
                        <input id="usuario-contrasena" type="password" class="form-control"
                            maxlength="72" autocomplete="new-password" ${esEdicion ? '' : 'required'}>
                        <small class="usuario-field-help">
                            ${esEdicion ? 'Dejar vacío para mantener la contraseña actual. ' : ''}${Validaciones.AYUDA_CONTRASENA}
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="usuario-dni">DNI</label>
                        <input id="usuario-dni" type="text" inputmode="numeric" class="form-control"
                            maxlength="8" autocomplete="off" value="${valor('dni')}" required>
                    </div>

                    <div class="form-group">
                        <label for="usuario-telefono">Teléfono</label>
                        <input id="usuario-telefono" type="text" class="form-control"
                            maxlength="20" autocomplete="off" value="${valor('telefono')}">
                    </div>

                    <div class="form-group">
                        <label for="usuario-rol">Rol</label>
                        <select id="usuario-rol" class="form-control" required>
                            <option value="">Seleccione un rol</option>
                            ${roles.map(rol => `
                                <option value="${rol.id}" ${Number(rol.id) === Number(rolActualId) ? 'selected' : ''}>
                                    ${this.escapeHtml(rol.nombre || '-')}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <p class="app-dialog-error" role="alert" hidden></p>

                <div class="dialog-actions">
                    <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;

        agregarOjosContrasena(dialog);

        dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.close());

        dialog.querySelector('.usuario-dialog-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.guardarUsuario(dialog, usuario, rolActualId);
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.querySelector('#usuario-email').focus();
    }

    /*
    * Valida el formulario y guarda:
    *   - alta:    POST /api/usuarios y luego POST /api/roles/{id}/usuarios
    *              (si falla la asignación del rol, se deshace el alta).
    *   - edición: PUT /api/usuarios/{id} y, si cambió el rol, se quita el
    *              anterior y se asigna el nuevo.
    */
    async guardarUsuario(dialog, usuario = null, rolActualId = '') {
        const esEdicion = usuario !== null;
        const campo = id => dialog.querySelector(`#usuario-${id}`);
        const mensajeError = dialog.querySelector('.app-dialog-error');

        const email = campo('email').value.trim();
        const nombre = campo('nombre').value.trim();
        const apellido = campo('apellido').value.trim();
        const contrasena = campo('contrasena').value;
        const dni = campo('dni').value.trim();
        const telefono = campo('telefono').value.trim();
        const idRol = campo('rol').value;

        // VALIDACIONES: pares [campo, error]; se muestra el primero que falle
        const reglas = [
            [campo('email'), Validaciones.email(email)],
            [campo('nombre'), Validaciones.nombre(nombre, 'nombre')],
            [campo('apellido'), Validaciones.nombre(apellido, 'apellido')],
            // La contraseña es obligatoria solo al crear
            [campo('contrasena'), (!esEdicion || contrasena) ? Validaciones.contrasena(contrasena) : null],
            [campo('dni'), Validaciones.dni(dni, true)],
            [campo('telefono'), Validaciones.telefono(telefono)],
            [campo('rol'), !idRol ? 'Seleccioná un rol.' : null]
        ];

        const fallo = reglas.find(([, error]) => error !== null);

        mensajeError.hidden = !fallo;

        if (fallo) {
            mensajeError.textContent = fallo[1];
            fallo[0].focus();
            return;
        }

        const datosUsuario = {
            email,
            nombre,
            apellido,
            dni: Number(dni),
            telefono: telefono || null
        };

        // En la edición, la contraseña solo se envía si se escribió una
        if (contrasena) {
            datosUsuario.contrasena = contrasena;
        }

        try {
            if (esEdicion) {
                await this.actualizarUsuario(usuario, datosUsuario, rolActualId, idRol);
            } else {
                await this.crearUsuario(datosUsuario, idRol);
            }

            dialog.close();

            await this.recargarUsuarios();

            this.mostrarSnackbar(esEdicion ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        } catch (error) {
            console.error('Error guardando usuario:', error);

            mensajeError.textContent = error.message ||
                (esEdicion ? 'No se pudo actualizar el usuario.' : 'No se pudo crear el usuario.');
            mensajeError.hidden = false;
        }
    }

    // POST /api/usuarios + asignación del rol
    async crearUsuario(datosUsuario, idRol) {
        const respuesta = await ApiClient.post('/usuarios', datosUsuario);
        const idUsuario = respuesta?.id;

        if (!idUsuario) {
            throw new Error('La API no devolvió el ID del usuario creado.');
        }

        try {
            await ApiClient.post(`/roles/${idRol}/usuarios`, { id_usuario: Number(idUsuario) });
        } catch (errorRol) {
            // No dejar un usuario creado sin el rol pedido
            try {
                await ApiClient.delete(`/usuarios/${idUsuario}`);
            } catch (errorRollback) {
                console.error('No se pudo revertir el usuario creado:', errorRollback);
            }

            throw errorRol;
        }
    }

    // PUT /api/usuarios/{id} + cambio de rol si corresponde
    async actualizarUsuario(usuario, datosUsuario, rolActualId, idRol) {
        await ApiClient.put(`/usuarios/${usuario.id}`, datosUsuario);

        const rolAnterior = rolActualId ? Number(rolActualId) : null;
        const rolNuevo = idRol ? Number(idRol) : null;

        if (rolAnterior === rolNuevo) return;

        if (rolAnterior) {
            await ApiClient.delete(`/roles/${rolAnterior}/usuarios/${usuario.id}`);
        }

        if (rolNuevo) {
            await ApiClient.post(`/roles/${rolNuevo}/usuarios`, { id_usuario: Number(usuario.id) });
        }
    }

    // =========================================================
    // DIALOG: ELIMINAR USUARIO
    // DELETE /api/usuarios/{id} (baja lógica)
    // =========================================================
    abrirDialogoEliminarUsuario(usuario) {
        const dialog = this.crearDialogoBase();
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
        const identificacion = nombreCompleto || usuario.email || 'este usuario';

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>Eliminar usuario</h2>
            </div>

            <div class="dialog-content">
                <p>¿Desea eliminar el usuario <strong>${this.escapeHtml(identificacion)}</strong>?</p>
            </div>

            <p class="app-dialog-error" role="alert" hidden></p>

            <div class="dialog-actions">
                <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>
                <button type="button" class="btn btn-danger dialog-confirm-delete">Eliminar</button>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.close());

        dialog.querySelector('.dialog-confirm-delete').addEventListener('click', async () => {
            try {
                await ApiClient.delete(`/usuarios/${usuario.id}`);

                dialog.close();

                await this.recargarUsuarios();

                this.mostrarSnackbar('Usuario eliminado correctamente.');
            } catch (error) {
                console.error('Error eliminando usuario:', error);

                const mensajeError = dialog.querySelector('.app-dialog-error');

                mensajeError.textContent = error.message || 'No se pudo eliminar el usuario.';
                mensajeError.hidden = false;
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();
    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    // <dialog> vacío con el estilo de los paneles
    crearDialogoBase() {
        const dialog = document.createElement('dialog');

        dialog.classList.add('custom-dialog');

        return dialog;
    }

    // 'dd/mm/aaaa' o '-'
    formatearFecha(fecha) {
        if (!fecha) return '-';

        const date = new Date(fecha);

        return isNaN(date.getTime()) ? fecha : date.toLocaleDateString('es-AR');
    }

    // Evita que un texto se interprete como HTML
    escapeHtml(text) {
        const div = document.createElement('div');

        div.textContent = text ?? '';

        return div.innerHTML;
    }

    // Aviso temporal abajo de la pantalla ('success' | 'error')
    mostrarSnackbar(mensaje, tipo = 'success') {
        const anterior = document.querySelector('.app-snackbar');

        if (anterior) anterior.remove();

        const snackbar = document.createElement('div');

        snackbar.className = `app-snackbar app-snackbar-${tipo}`;
        snackbar.innerHTML = `
            <i class="bi ${tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}"></i>
            <span>${this.escapeHtml(mensaje)}</span>
        `;

        document.body.appendChild(snackbar);

        requestAnimationFrame(() => snackbar.classList.add('show'));

        setTimeout(() => {
            snackbar.classList.remove('show');
            setTimeout(() => snackbar.remove(), 300);
        }, 3000);
    }
}

customElements.define('app-usuarios', UsuariosComponent);
