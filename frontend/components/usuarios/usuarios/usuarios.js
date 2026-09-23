class UsuariosComponent extends HTMLElement {

    constructor() {

        super();

        // =====================================================
        // CONFIGURACIÓN
        // =====================================================

        this.usuariosPerPage = 5;


        // =====================================================
        // DATOS
        // =====================================================

        this.usuarios = [];
        this.roles = [];


        // =====================================================
        // PAGINACIÓN
        // =====================================================

        this.usuariosCurrentPage = 1;

    }


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    async connectedCallback() {

        try {

            const response = await fetch(
                'components/usuarios/usuarios/usuarios.html'
            );

            if (!response.ok) {

                throw new Error(
                    'Error al cargar vista de usuarios.'
                );

            }

            const html = await response.text();

            this.innerHTML = `
                <link
                    rel="stylesheet"
                    href="components/usuarios/usuarios/usuarios.css">

                ${html}
            `;

            this.initEvents();

            await this.cargarUsuarios();

        } catch (error) {

            console.error(
                'Error inicializando <app-usuarios>:',
                error
            );

        }

    }


    // =====================================================
    // EVENTOS
    // =====================================================

    initEvents() {

        // -------------------------------------------------
        // REFRESCAR
        // -------------------------------------------------

        const btnRefresh =
            this.querySelector('#btn-refresh');

        if (btnRefresh) {

            btnRefresh.addEventListener(
                'click',
                () => this.recargarUsuarios()
            );

        }


        // -------------------------------------------------
        // AGREGAR USUARIO
        // -------------------------------------------------

        const btnAddUsuario =
            this.querySelector('#btn-add-usuario');

        if (btnAddUsuario) {

            btnAddUsuario.addEventListener(
                'click',
                () => this.abrirDialogoCrearUsuario()
            );

        }


        // -------------------------------------------------
        // PAGINACIÓN ANTERIOR
        // -------------------------------------------------

        const usuariosPrev =
            this.querySelector('#usuarios-prev');

        if (usuariosPrev) {

            usuariosPrev.addEventListener(
                'click',
                () => {

                    if (this.usuariosCurrentPage > 1) {

                        this.usuariosCurrentPage--;

                        this.renderUsuarios();

                    }

                }
            );

        }


        // -------------------------------------------------
        // PAGINACIÓN SIGUIENTE
        // -------------------------------------------------

        const usuariosNext =
            this.querySelector('#usuarios-next');

        if (usuariosNext) {

            usuariosNext.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.ceil(
                            this.usuarios.length /
                            this.usuariosPerPage
                        );

                    if (
                        this.usuariosCurrentPage <
                        totalPages
                    ) {

                        this.usuariosCurrentPage++;

                        this.renderUsuarios();

                    }

                }
            );

        }

    }


    // =====================================================
    // RECARGAR
    // =====================================================

    async recargarUsuarios() {

        this.usuariosCurrentPage = 1;

        await this.cargarUsuarios();

    }


    // =====================================================
    // GET /api/usuarios
    // =====================================================

    async cargarUsuarios() {

        const tbody =
            this.querySelector('#tb-usuarios');

        if (!tbody) {

            console.error(
                'No se encontró #tb-usuarios'
            );

            return;

        }


        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center">

                    Cargando usuarios...

                </td>
            </tr>
        `;


        try {

            const usuarios =
                await ApiClient.get('/usuarios');

            this.usuarios =
                usuarios || [];

            this.usuariosCurrentPage = 1;


            // -------------------------------------------------
            // SIN USUARIOS
            // -------------------------------------------------

            if (this.usuarios.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="text-center text-muted">

                            No hay usuarios registrados.

                        </td>
                    </tr>
                `;

                this.actualizarPaginacion();

                return;

            }


            // -------------------------------------------------
            // RENDERIZAR
            // -------------------------------------------------

            this.renderUsuarios();

        } catch (error) {

            console.error(
                'Error cargando usuarios:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="text-center text-danger">

                        Error al cargar usuarios.

                    </td>
                </tr>
            `;

            this.actualizarPaginacion();

        }

    }


    // =====================================================
    // RENDER USUARIOS
    // =====================================================

    renderUsuarios() {

        const tbody =
            this.querySelector('#tb-usuarios');

        if (!tbody) return;


        tbody.innerHTML = '';


        const start =
            (this.usuariosCurrentPage - 1) *
            this.usuariosPerPage;

        const end =
            start +
            this.usuariosPerPage;


        const usuariosPagina =
            this.usuarios.slice(
                start,
                end
            );


        usuariosPagina.forEach(usuario => {

            const tr =
                document.createElement('tr');


            tr.dataset.id =
                usuario.id;


            tr.innerHTML = `

                <td>
                    ${this.escapeHtml(
                        usuario.nombre || '-'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        usuario.apellido || '-'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        usuario.email || '-'
                    )}
                </td>

                <td>
                    ${this.escapeHtml(
                        usuario.rol || 'Sin rol'
                    )}
                </td>

                <td>
                    ${usuario.cantidad_sesiones ?? 0}
                </td>

                <td>
                    ${this.formatearFecha(
                        usuario.fecha_alta
                    )}
                </td>

                <td>
                    ${
                        usuario.fecha_baja
                            ? this.formatearFecha(
                                usuario.fecha_baja
                            )
                            : '-'
                    }
                </td>

                <td class="text-center">

                    <div class="action-btn-group">

                        <button
                            class="btn-action edit"
                            title="Editar"
                            type="button">

                            <i class="bi bi-pencil-fill"></i>

                        </button>

                        <button
                            class="btn-action delete"
                            title="Eliminar"
                            type="button">

                            <i class="bi bi-trash-fill"></i>

                        </button>

                    </div>

                </td>

            `;


            // -------------------------------------------------
            // EDITAR
            // -------------------------------------------------

            const btnEdit =
                tr.querySelector(
                    '.btn-action.edit'
                );

            if (btnEdit) {

                btnEdit.addEventListener(
                    'click',
                    (event) => {

                        event.stopPropagation();

                        this.abrirDialogoEditarUsuario(
                            usuario
                        );

                    }
                );

            }


            // -------------------------------------------------
            // ELIMINAR
            // -------------------------------------------------

            const btnDelete =
                tr.querySelector(
                    '.btn-action.delete'
                );

            if (btnDelete) {

                btnDelete.addEventListener(
                    'click',
                    (event) => {

                        event.stopPropagation();

                        this.abrirDialogoEliminarUsuario(
                            usuario
                        );

                    }
                );

            }


            tbody.appendChild(tr);

        });


        this.actualizarPaginacion();

    }


    // =====================================================
    // FORMATEAR FECHA
    // =====================================================

    formatearFecha(fecha) {

        if (!fecha) {

            return '-';

        }


        const date =
            new Date(fecha);


        if (isNaN(date.getTime())) {

            return fecha;

        }


        return date.toLocaleDateString(
            'es-AR'
        );

    }


    // =====================================================
    // PAGINACIÓN
    // =====================================================

    actualizarPaginacion() {

        const total =
            this.usuarios.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.usuariosPerPage
                )
            );


        // Evitar quedar en una página inexistente
        if (
            this.usuariosCurrentPage >
            totalPages
        ) {

            this.usuariosCurrentPage =
                totalPages;

        }


        const start =
            total === 0
                ? 0
                : (
                    (
                        this.usuariosCurrentPage - 1
                    ) *
                    this.usuariosPerPage
                ) + 1;


        const end =
            Math.min(
                this.usuariosCurrentPage *
                this.usuariosPerPage,
                total
            );


        const info =
            this.querySelector(
                '#usuarios-page-info'
            );


        const pageNumber =
            this.querySelector(
                '#usuarios-page-number'
            );


        const prev =
            this.querySelector(
                '#usuarios-prev'
            );


        const next =
            this.querySelector(
                '#usuarios-next'
            );


        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }


        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.usuariosCurrentPage} de ${totalPages}`;

        }


        if (prev) {

            prev.disabled =
                this.usuariosCurrentPage <= 1;

        }


        if (next) {

            next.disabled =
                this.usuariosCurrentPage >= totalPages;

        }

    }


    // =====================================================
    // CARGAR ROLES
    // GET /api/roles
    // =====================================================

    async cargarRoles() {

        try {

            const roles =
                await ApiClient.get('/roles');

            this.roles =
                roles || [];

            return this.roles;

        } catch (error) {

            console.error(
                'Error cargando roles:',
                error
            );

            throw error;

        }

    }


    // =====================================================
    // CREAR USUARIO
    // =====================================================

    async abrirDialogoCrearUsuario() {

        let roles = [];

        try {

            roles =
                await this.cargarRoles();

        } catch (error) {

            this.mostrarSnackbar(
                'No se pudieron cargar los roles.',
                'error'
            );

            return;

        }


        const dialog =
            this.crearDialogoBase();


        dialog.innerHTML = `

            <div class="dialog-header">

                <h2>
                    Agregar usuario
                </h2>

            </div>


            <form class="dialog-form usuario-dialog-form">

                <div class="usuario-dialog-fields">

                    <div class="form-group">

                        <label for="usuario-email">
                            Email
                        </label>

                        <input
                            id="usuario-email"
                            type="email"
                            class="form-control"
                            maxlength="150"
                            autocomplete="off"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-nombre">
                            Nombre
                        </label>

                        <input
                            id="usuario-nombre"
                            type="text"
                            class="form-control"
                            maxlength="100"
                            autocomplete="off"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-apellido">
                            Apellido
                        </label>

                        <input
                            id="usuario-apellido"
                            type="text"
                            class="form-control"
                            maxlength="100"
                            autocomplete="off"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-contrasena">
                            Contraseña
                        </label>

                        <input
                            id="usuario-contrasena"
                            type="password"
                            class="form-control"
                            maxlength="100"
                            autocomplete="new-password"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-dni">
                            DNI
                        </label>

                        <input
                            id="usuario-dni"
                            type="number"
                            class="form-control"
                            min="1"
                            autocomplete="off"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-telefono">
                            Teléfono
                        </label>

                        <input
                            id="usuario-telefono"
                            type="text"
                            class="form-control"
                            maxlength="50"
                            autocomplete="off">

                    </div>


                    <div class="form-group">

                        <label for="usuario-rol">
                            Rol
                        </label>

                        <select
                            id="usuario-rol"
                            class="form-control"
                            required>

                            <option value="">
                                Seleccione un rol
                            </option>

                            ${roles.map(rol => `
                                <option value="${rol.id}">
                                    ${this.escapeHtml(
                                        rol.nombre ||
                                        rol.rol ||
                                        '-'
                                    )}
                                </option>
                            `).join('')}

                        </select>

                    </div>

                </div>


                <div class="dialog-actions">

                    <button
                        type="button"
                        class="btn btn-secondary dialog-cancel">

                        Cancelar

                    </button>


                    <button
                        type="submit"
                        class="btn btn-primary">

                        Guardar

                    </button>

                </div>

            </form>
        `;


        this.configurarDialogoUsuario(
            dialog
        );


        const form =
            dialog.querySelector(
                '.usuario-dialog-form'
            );


        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();

                await this.guardarUsuario(
                    dialog,
                    null
                );

            }
        );


        document.body.appendChild(dialog);

        dialog.showModal();


        dialog.querySelector(
            '#usuario-email'
        ).focus();


        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

    }


    // =====================================================
    // EDITAR USUARIO
    // =====================================================

    async abrirDialogoEditarUsuario(usuario) {

        let roles = [];

        try {

            roles =
                await this.cargarRoles();

        } catch (error) {

            this.mostrarSnackbar(
                'No se pudieron cargar los roles.',
                'error'
            );

            return;

        }


        /*
         * Buscar el rol actual por nombre.
         *
         * GET /api/usuarios devuelve "rol"
         * como nombre del rol.
         */

        let rolActualId = '';


        if (usuario.rol) {

            const rolActual =
                roles.find(
                    rol =>
                        (
                            rol.nombre ||
                            rol.rol ||
                            ''
                        ).toLowerCase() ===
                        usuario.rol.toLowerCase()
                );


            if (rolActual) {

                rolActualId =
                    rolActual.id;

            }

        }


        const dialog =
            this.crearDialogoBase();


        dialog.innerHTML = `

            <div class="dialog-header">

                <h2>
                    Editar usuario
                </h2>

            </div>


            <form class="dialog-form usuario-dialog-form">

                <div class="usuario-dialog-fields">

                    <div class="form-group">

                        <label for="usuario-email">
                            Email
                        </label>

                        <input
                            id="usuario-email"
                            type="email"
                            class="form-control"
                            maxlength="150"
                            autocomplete="off"
                            value="${this.escapeHtml(
                                usuario.email || ''
                            )}"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-nombre">
                            Nombre
                        </label>

                        <input
                            id="usuario-nombre"
                            type="text"
                            class="form-control"
                            maxlength="100"
                            autocomplete="off"
                            value="${this.escapeHtml(
                                usuario.nombre || ''
                            )}"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-apellido">
                            Apellido
                        </label>

                        <input
                            id="usuario-apellido"
                            type="text"
                            class="form-control"
                            maxlength="100"
                            autocomplete="off"
                            value="${this.escapeHtml(
                                usuario.apellido || ''
                            )}"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-contrasena">
                            Contraseña
                        </label>

                        <input
                            id="usuario-contrasena"
                            type="password"
                            class="form-control"
                            maxlength="100"
                            autocomplete="new-password">

                        <small class="usuario-field-help">
                            Dejar vacío para mantener la contraseña actual.
                        </small>

                    </div>


                    <div class="form-group">

                        <label for="usuario-dni">
                            DNI
                        </label>

                        <input
                            id="usuario-dni"
                            type="number"
                            class="form-control"
                            min="1"
                            autocomplete="off"
                            value="${usuario.dni ?? ''}"
                            required>

                    </div>


                    <div class="form-group">

                        <label for="usuario-telefono">
                            Teléfono
                        </label>

                        <input
                            id="usuario-telefono"
                            type="text"
                            class="form-control"
                            maxlength="50"
                            autocomplete="off"
                            value="${this.escapeHtml(
                                usuario.telefono || ''
                            )}">

                    </div>


                    <div class="form-group">

                        <label for="usuario-rol">
                            Rol
                        </label>

                        <select
                            id="usuario-rol"
                            class="form-control"
                            required>

                            <option value="">
                                Sin rol
                            </option>

                            ${roles.map(rol => `
                                <option
                                    value="${rol.id}"
                                    ${
                                        Number(rol.id) ===
                                        Number(rolActualId)
                                            ? 'selected'
                                            : ''
                                    }>

                                    ${this.escapeHtml(
                                        rol.nombre ||
                                        rol.rol ||
                                        '-'
                                    )}

                                </option>
                            `).join('')}

                        </select>

                    </div>

                </div>

                <div class="dialog-actions">

                    <button
                        type="button"
                        class="btn btn-secondary dialog-cancel">
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary">
                        Guardar 
                    </button>

                </div>

            </form>
        `;


        this.configurarDialogoUsuario(
            dialog
        );


        const form =
            dialog.querySelector(
                '.usuario-dialog-form'
            );


        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();

                await this.guardarUsuario(
                    dialog,
                    usuario,
                    rolActualId
                );

            }
        );


        document.body.appendChild(dialog);

        dialog.showModal();


        dialog.querySelector(
            '#usuario-email'
        ).focus();


        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

    }


    // =====================================================
    // CONFIGURAR DIALOG USUARIO
    // =====================================================

    configurarDialogoUsuario(dialog) {

        const btnCancel =
            dialog.querySelector(
                '.dialog-cancel'
            );


        if (btnCancel) {

            btnCancel.addEventListener(
                'click',
                () => dialog.close()
            );

        }

    }


    // =====================================================
    // GUARDAR USUARIO
    // =====================================================

    async guardarUsuario(
        dialog,
        usuario = null,
        rolActualId = ''
    ) {

        const email =
            dialog.querySelector(
                '#usuario-email'
            ).value.trim();


        const nombre =
            dialog.querySelector(
                '#usuario-nombre'
            ).value.trim();


        const apellido =
            dialog.querySelector(
                '#usuario-apellido'
            ).value.trim();


        const contrasena =
            dialog.querySelector(
                '#usuario-contrasena'
            ).value;


        const dni =
            dialog.querySelector(
                '#usuario-dni'
            ).value;


        const telefono =
            dialog.querySelector(
                '#usuario-telefono'
            ).value.trim();


        const idRol =
            dialog.querySelector(
                '#usuario-rol'
            ).value;


        // -------------------------------------------------
        // VALIDACIONES
        // -------------------------------------------------

        if (!email) {

            dialog.querySelector(
                '#usuario-email'
            ).focus();

            return;

        }


        if (!nombre) {

            dialog.querySelector(
                '#usuario-nombre'
            ).focus();

            return;

        }


        if (!apellido) {

            dialog.querySelector(
                '#usuario-apellido'
            ).focus();

            return;

        }


        // Contraseña obligatoria únicamente al crear
        if (!usuario && !contrasena) {

            dialog.querySelector(
                '#usuario-contrasena'
            ).focus();

            return;

        }


        if (!dni) {

            dialog.querySelector(
                '#usuario-dni'
            ).focus();

            return;

        }


        if (!idRol) {

            dialog.querySelector(
                '#usuario-rol'
            ).focus();

            return;

        }


        const esEdicion =
            usuario !== null;


        try {

            // =================================================
            // CREAR USUARIO
            // =================================================

            if (!esEdicion) {

                const datosUsuario = {

                    email: email,

                    nombre: nombre,

                    apellido: apellido,

                    contrasena: contrasena,

                    dni: Number(dni),

                    telefono: telefono || null

                };


                // ---------------------------------------------
                // 1. CREAR USUARIO
                // ---------------------------------------------

                const respuesta =
                    await ApiClient.post(
                        '/usuarios',
                        datosUsuario
                    );


                const idUsuario =
                    respuesta?.id;


                if (!idUsuario) {

                    throw new Error(
                        'La API no devolvió el ID del usuario creado.'
                    );

                }


                // ---------------------------------------------
                // 2. ASIGNAR ROL
                // ---------------------------------------------

                try {

                    await ApiClient.post(
                        `/roles/${idRol}/usuarios`,
                        {
                            id_usuario: Number(idUsuario)
                        }
                    );

                } catch (errorRol) {

                    /*
                     * Si el usuario se creó pero falló
                     * la asignación del rol, intentamos
                     * eliminarlo para no dejar un usuario
                     * creado sin la asociación solicitada.
                     */

                    try {

                        await ApiClient.delete(
                            `/usuarios/${idUsuario}`
                        );

                    } catch (errorRollback) {

                        console.error(
                            'No se pudo revertir el usuario creado:',
                            errorRollback
                        );

                    }

                    throw errorRol;

                }


                // ---------------------------------------------
                // FINALIZAR CREACIÓN
                // ---------------------------------------------

                dialog.close();

                await this.recargarUsuarios();

                this.mostrarSnackbar(
                    'Usuario creado correctamente.'
                );

                return;

            }


            // =================================================
            // EDITAR USUARIO
            // =================================================

            const datosUsuario = {

                email: email,

                nombre: nombre,

                apellido: apellido,

                dni: Number(dni),

                telefono: telefono || null

            };


            // Solo enviar contraseña si se modificó
            if (contrasena) {

                datosUsuario.contrasena =
                    contrasena;

            }


            // ---------------------------------------------
            // 1. ACTUALIZAR DATOS
            // ---------------------------------------------

            await ApiClient.put(
                `/usuarios/${usuario.id}`,
                datosUsuario
            );


            // ---------------------------------------------
            // 2. CAMBIAR ROL SI CORRESPONDE
            // ---------------------------------------------

            const rolAnterior =
                rolActualId
                    ? Number(rolActualId)
                    : null;


            const rolNuevo =
                idRol
                    ? Number(idRol)
                    : null;


            if (rolAnterior !== rolNuevo) {

                // -----------------------------------------
                // Quitar rol anterior
                // -----------------------------------------

                if (rolAnterior) {

                    await ApiClient.delete(
                        `/roles/${rolAnterior}/usuarios/${usuario.id}`
                    );

                }


                // -----------------------------------------
                // Asignar nuevo rol
                // -----------------------------------------

                if (rolNuevo) {

                    await ApiClient.post(
                        `/roles/${rolNuevo}/usuarios`,
                        {
                            id_usuario:
                                Number(usuario.id)
                        }
                    );

                }

            }


            // ---------------------------------------------
            // FINALIZAR EDICIÓN
            // ---------------------------------------------

            dialog.close();

            await this.recargarUsuarios();

            this.mostrarSnackbar(
                'Usuario actualizado correctamente.'
            );

        } catch (error) {

            console.error(
                'Error guardando usuario:',
                error
            );


            this.mostrarSnackbar(
                esEdicion
                    ? 'No se pudo actualizar el usuario. Verificá los datos e intentá nuevamente.'
                    : 'No se pudo crear el usuario. Verificá los datos e intentá nuevamente.',
                'error'
            );

        }

    }


    // =====================================================
    // ELIMINAR USUARIO
    // =====================================================

    abrirDialogoEliminarUsuario(usuario) {

        const dialog =
            this.crearDialogoBase();


        const nombreCompleto =
            `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();


        const identificacion =
            nombreCompleto ||
            usuario.email ||
            'este usuario';


        dialog.innerHTML = `

            <div class="dialog-header">

                <h2>
                    Eliminar usuario
                </h2>

            </div>


            <div class="dialog-content">

                <p>

                    ¿Desea eliminar el usuario

                    <strong>
                        ${this.escapeHtml(
                            identificacion
                        )}
                    </strong>?

                </p>

            </div>


            <div class="dialog-actions">

                <button
                    type="button"
                    class="btn btn-secondary dialog-cancel">

                    Cancelar

                </button>


                <button
                    type="button"
                    class="btn btn-danger dialog-confirm-delete">

                    Eliminar

                </button>

            </div>
        `;


        document.body.appendChild(dialog);


        // -------------------------------------------------
        // CANCELAR
        // -------------------------------------------------

        const btnCancel =
            dialog.querySelector(
                '.dialog-cancel'
            );


        btnCancel.addEventListener(
            'click',
            () => dialog.close()
        );


        // -------------------------------------------------
        // CONFIRMAR
        // -------------------------------------------------

        const btnDelete =
            dialog.querySelector(
                '.dialog-confirm-delete'
            );


        btnDelete.addEventListener(
            'click',
            async () => {

                try {

                    await ApiClient.delete(
                        `/usuarios/${usuario.id}`
                    );


                    dialog.close();


                    await this.recargarUsuarios();


                    this.mostrarSnackbar(
                        'Usuario eliminado correctamente.'
                    );

                } catch (error) {

                    console.error(
                        'Error eliminando usuario:',
                        error
                    );


                    this.mostrarSnackbar(
                        'No se pudo eliminar el usuario.',
                        'error'
                    );

                }

            }
        );


        dialog.addEventListener(
            'close',
            () => {
                dialog.remove();
            },
            { once: true }
        );


        dialog.showModal();

    }


    // =====================================================
    // CREAR DIALOG BASE
    // =====================================================

    crearDialogoBase() {

        const dialog =
            document.createElement('dialog');

        dialog.classList.add(
            'custom-dialog'
        );

        return dialog;

    }


    // =====================================================
    // ESCAPAR HTML
    // =====================================================

    escapeHtml(text) {

        const div =
            document.createElement('div');

        div.textContent =
            text ?? '';

        return div.innerHTML;

    }


    // =====================================================
    // SNACKBAR
    // =====================================================

    mostrarSnackbar(
        mensaje,
        tipo = 'success'
    ) {

        const anterior =
            document.querySelector(
                '.app-snackbar'
            );


        if (anterior) {

            anterior.remove();

        }


        const snackbar =
            document.createElement('div');


        snackbar.className =
            `app-snackbar app-snackbar-${tipo}`;


        snackbar.innerHTML = `

            <i class="bi ${
                tipo === 'success'
                    ? 'bi-check-circle-fill'
                    : 'bi-exclamation-circle-fill'
            }"></i>

            <span>
                ${this.escapeHtml(mensaje)}
            </span>

        `;


        document.body.appendChild(
            snackbar
        );


        requestAnimationFrame(() => {

            snackbar.classList.add(
                'show'
            );

        });


        setTimeout(() => {

            snackbar.classList.remove(
                'show'
            );


            setTimeout(() => {

                snackbar.remove();

            }, 300);

        }, 3000);

    }

}


// =====================================================
// REGISTRAR COMPONENTE
// =====================================================
customElements.define(
    'app-usuarios',
    UsuariosComponent
);