class RolesComponent extends HTMLElement {

    constructor() {
        super();

        this.selectedRolId = null;

        // Cantidad máxima de elementos por página
        this.rolesPerPage = 10;
        this.modulosPerPage = 3;
        this.panelesPerPage = 3;

        // Datos
        this.roles = [];
        this.modulos = [];
        this.paneles = [];

        // Página actual
        this.rolesCurrentPage = 1;
        this.modulosCurrentPage = 1;
        this.panelesCurrentPage = 1;
    }

    async connectedCallback() {

        try {

            const response = await fetch(
                'components/usuarios/roles/roles.html'
            );

            if (!response.ok) {
                throw new Error('Error al cargar vista de roles.');
            }

            const html = await response.text();

            this.innerHTML = `
                <link rel="stylesheet" href="components/usuarios/roles/roles.css">
                ${html}
            `;

            this.initEvents();

            await this.cargarRoles();

        } catch (error) {

            console.error(
                'Error inicializando <app-roles>:',
                error
            );

        }
    }

    // EVENTOS
    initEvents() {

        // REFRESCAR
        const btnRefresh = this.querySelector('#btn-refresh');

        if (btnRefresh) {
            btnRefresh.addEventListener(
                'click',
                () => this.recargarTodo()
            );
        }

        // AGREGAR ROL
        const btnAddRol = this.querySelector('#btn-add-rol');

        if (btnAddRol) {
            btnAddRol.addEventListener('click', () => {
                this.abrirDialogoCrearRol();
            });
        }

        // AGREGAR MÓDULO
        const btnAddModulo = this.querySelector('#btn-add-modulo');

        if (btnAddModulo) {
            btnAddModulo.addEventListener(
                'click',
                () => this.abrirDialogoCrear('modulo')
            );
        }

        // AGREGAR PANEL
        const btnAddPanel = this.querySelector('#btn-add-panel');

        if (btnAddPanel) {
            btnAddPanel.addEventListener(
                'click',
                () => this.abrirDialogoCrear('panel')
            );
        }

        // PAGINACIÓN ROLES
        const rolesPrev = this.querySelector('#roles-prev');
        const rolesNext = this.querySelector('#roles-next');

        if (rolesPrev) {
            rolesPrev.addEventListener(
                'click',
                () => {
                    if (this.rolesCurrentPage > 1) {
                        this.rolesCurrentPage--;
                        this.renderRoles();
                    }
                }
            );
        }

        if (rolesNext) {
            rolesNext.addEventListener(
                'click',
                () => {
                    const totalPages =
                        Math.ceil(
                            this.roles.length /
                            this.rolesPerPage
                        );
                    if (
                        this.rolesCurrentPage <
                        totalPages
                    ) {
                        this.rolesCurrentPage++;
                        this.renderRoles();
                    }
                }
            );
        }

        // PAGINACIÓN MÓDULOS
        const modulosPrev = this.querySelector('#modulos-prev');
        const modulosNext = this.querySelector('#modulos-next');

        if (modulosPrev) {
            modulosPrev.addEventListener(
                'click',
                () => {
                    if (this.modulosCurrentPage > 1) {
                        this.modulosCurrentPage--;
                        this.renderModulos();
                    }
                }
            );
        }

        if (modulosNext) {
            modulosNext.addEventListener(
                'click',
                () => {
                    const totalPages =
                        Math.ceil(
                            this.modulos.length /
                            this.modulosPerPage
                        );
                    if (
                        this.modulosCurrentPage <
                        totalPages
                    ) {
                        this.modulosCurrentPage++;
                        this.renderModulos();
                    }
                }
            );

        }

        // PAGINACIÓN PANELES
        const panelesPrev = this.querySelector('#paneles-prev');
        const panelesNext = this.querySelector('#paneles-next');

        if (panelesPrev) {
            panelesPrev.addEventListener(
                'click',
                () => {
                    if (this.panelesCurrentPage > 1) {
                        this.panelesCurrentPage--;
                        this.renderPaneles();
                    }
                }
            );
        }

        if (panelesNext) {
            panelesNext.addEventListener(
                'click',
                () => {
                    const totalPages =
                        Math.ceil(
                            this.paneles.length /
                            this.panelesPerPage
                        );
                    if (
                        this.panelesCurrentPage <
                        totalPages
                    ) {
                        this.panelesCurrentPage++;
                        this.renderPaneles();
                    }
                }
            );
        }

    }

    // RECARGAR TODO
    async recargarTodo() {
        this.rolesCurrentPage = 1;
        this.modulosCurrentPage = 1;
        this.panelesCurrentPage = 1;
        await this.cargarRoles();
    }

    // ROLES
    // GET /api/roles
    async cargarRoles() {

        const tbody =
            this.querySelector('#tb-roles');

        if (!tbody) {

            console.error(
                'No se encontró #tb-roles'
            );

            return;

        }

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="text-center">
                    Cargando roles...
                </td>
            </tr>
        `;

        try {

            const roles =
                await ApiClient.get('/roles');

            this.roles = roles || [];

            this.rolesCurrentPage = 1;

            // Si no hay roles
            if (this.roles.length === 0) {

                this.selectedRolId = null;

                this.modulos = [];
                this.paneles = [];

                this.modulosCurrentPage = 1;
                this.panelesCurrentPage = 1;

                tbody.innerHTML = `
                    <tr>
                        <td
                            colspan="4"
                            class="text-center">
                            No hay roles registrados.
                        </td>
                    </tr>
                `;

                this.actualizarPaginacionRoles();

                this.renderModulos();
                this.renderPaneles();

                return;
            }

            // Renderizar roles
            this.renderRoles();

            // Seleccionar automáticamente
            // el primer rol

            const firstRow =
                this.querySelector(
                    '#tb-roles tr'
                );

            if (firstRow) {

                this.seleccionarRol(
                    this.roles[0].id,
                    firstRow
                );

            }

        } catch (error) {

            console.error(
                'Error cargando roles:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="text-center text-danger">
                        Error al cargar roles.
                    </td>
                </tr>
            `;

        }

    }

    // RENDER ROLES
    renderRoles() {

        const tbody = this.querySelector('#tb-roles');

        if (!tbody) return;

        tbody.innerHTML = '';

        const start =
            (this.rolesCurrentPage - 1) *
            this.rolesPerPage;

        const end =
            start +
            this.rolesPerPage;

        const rolesPagina =
            this.roles.slice(
                start,
                end
            );

        rolesPagina.forEach(rol => {

            const tr =
                document.createElement('tr');

            tr.dataset.id = rol.id;

            tr.innerHTML = `
                <td>
                    ${rol.nombre || rol.rol || '-'}
                </td>

                <td>
                    ${rol.duracion_token || '-'}
                </td>

                <td class="text-center">

                    <div class="action-btn-group">

                        <button
                            class="btn-action view"
                            title="Ver detalles"
                            type="button">
                            <i class="bi bi-eye"></i>
                        </button>

                        <button
                            class="btn-action edit"
                            title="Editar"
                            type="button">
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            class="btn-action delete"
                            title="Eliminar"
                            type="button">
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>

                </td>
            `;

            tr.addEventListener(
                'click',
                (e) => {

                    if (
                        !e.target.closest(
                            '.btn-action'
                        )
                    ) {

                        this.seleccionarRol(
                            rol.id,
                            tr
                        );

                    }

                }
            );

            const btnEdit = tr.querySelector('.btn-action.edit');
            const btnDelete = tr.querySelector('.btn-action.delete');
            const btnView = tr.querySelector('.btn-action.view');

            if (btnEdit) {
                btnEdit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.abrirDialogoEditarRol(rol);
                });
            }

            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.abrirDialogoEliminarRol(rol);
                });
            }

            if (btnView) {
                btnView.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.abrirDialogoVerRol(rol);
                });
            }

            tbody.appendChild(tr);

        });

        this.actualizarPaginacionRoles();

        // Mantener seleccionado el rol actual

        if (this.selectedRolId !== null) {

            const selectedRow =
                tbody.querySelector(
                    `tr[data-id="${this.selectedRolId}"]`
                );

            if (selectedRow) {

                selectedRow.classList.add(
                    'active-row'
                );

            }

        }

    }

    // =====================================================
    // PAGINACIÓN ROLES
    // =====================================================

    actualizarPaginacionRoles() {

        const total =
            this.roles.length;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.rolesPerPage
                )
            );

        const start =
            total === 0
                ? 0
                : (
                    (this.rolesCurrentPage - 1) *
                    this.rolesPerPage
                ) + 1;

        const end =
            Math.min(
                this.rolesCurrentPage *
                this.rolesPerPage,
                total
            );

        const info =
            this.querySelector(
                '#roles-page-info'
            );

        const pageNumber =
            this.querySelector(
                '#roles-page-number'
            );

        const prev =
            this.querySelector(
                '#roles-prev'
            );

        const next =
            this.querySelector(
                '#roles-next'
            );

        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }

        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.rolesCurrentPage} de ${totalPages}`;

        }

        if (prev) {

            prev.disabled =
                this.rolesCurrentPage <= 1;

        }

        if (next) {

            next.disabled =
                this.rolesCurrentPage >= totalPages;

        }

    }

    // =====================================================
    // SELECCIONAR ROL
    // =====================================================

    seleccionarRol(
        rolId,
        elementRow
    ) {

        this.selectedRolId = rolId;

        this.querySelectorAll(
            '#tb-roles tr'
        ).forEach(row => {

            row.classList.remove(
                'active-row'
            );

        });

        if (elementRow) {

            elementRow.classList.add(
                'active-row'
            );

        }

        this.cargarModulosRol();
        this.cargarPanelesRol();

    }

    // =====================================================
    // MÓDULOS
    // GET /api/modulos
    // =====================================================

    async cargarModulosRol() {

        const tbody =
            this.querySelector(
                '#tb-modulos'
            );

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="2"
                    class="text-center">
                    Cargando...
                </td>
            </tr>
        `;

        try {

            const modulos =
                await ApiClient.get('/modulos');

            this.modulos =
                modulos || [];

            this.modulosCurrentPage = 1;

            this.renderModulos();

        } catch (error) {

            console.error(
                'Error obteniendo módulos:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="text-center text-danger">
                        Error al obtener módulos.
                    </td>
                </tr>
            `;

        }

    }

    // =====================================================
    // RENDER MÓDULOS
    // =====================================================

    renderModulos() {

        const tbody =
            this.querySelector(
                '#tb-modulos'
            );

        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.modulos.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="text-center text-muted">
                        No hay módulos registrados.
                    </td>
                </tr>
            `;

            this.actualizarPaginacionModulos();

            return;

        }

        const start =
            (this.modulosCurrentPage - 1) *
            this.modulosPerPage;

        const end =
            start +
            this.modulosPerPage;

        const modulosPagina =
            this.modulos.slice(
                start,
                end
            );

        modulosPagina.forEach(mod => {

            const tr = document.createElement('tr');

            tr.dataset.id = mod.id;

            tr.innerHTML = `
                <td>${mod.nombre || mod.modulo || '-'}</td>

                <td class="text-center">
                    <div class="action-btn-group">
                        <button
                            class="btn-action edit"
                            title="Editar"
                            type="button">
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            class="btn-action delete"
                            title="Eliminar"
                            type="button">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // EDITAR
            const btnEdit = tr.querySelector('.btn-action.edit');

            btnEdit.addEventListener(
                'click',
                () => this.abrirDialogoEditar('modulo', mod)
            );

            // ELIMINAR
            const btnDelete = tr.querySelector('.btn-action.delete');

            btnDelete.addEventListener(
                'click',
                () => this.abrirDialogoEliminar('modulo', mod)
            );

            tbody.appendChild(tr);
        });

        this.actualizarPaginacionModulos();

    }

    // =====================================================
    // PAGINACIÓN MÓDULOS
    // =====================================================

    actualizarPaginacionModulos() {

        const total =
            this.modulos.length;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.modulosPerPage
                )
            );

        const start =
            total === 0
                ? 0
                : (
                    (this.modulosCurrentPage - 1) *
                    this.modulosPerPage
                ) + 1;

        const end =
            Math.min(
                this.modulosCurrentPage *
                this.modulosPerPage,
                total
            );

        const info =
            this.querySelector(
                '#modulos-page-info'
            );

        const pageNumber =
            this.querySelector(
                '#modulos-page-number'
            );

        const prev =
            this.querySelector(
                '#modulos-prev'
            );

        const next =
            this.querySelector(
                '#modulos-next'
            );

        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }

        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.modulosCurrentPage} de ${totalPages}`;

        }

        if (prev) {

            prev.disabled =
                this.modulosCurrentPage <= 1;

        }

        if (next) {

            next.disabled =
                this.modulosCurrentPage >= totalPages;

        }

    }

    // =====================================================
    // PANELES
    // GET /api/paneles
    // =====================================================

    async cargarPanelesRol() {

        const tbody =
            this.querySelector(
                '#tb-paneles'
            );

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="2"
                    class="text-center">
                    Cargando...
                </td>
            </tr>
        `;

        try {

            const paneles =
                await ApiClient.get('/paneles');

            this.paneles =
                paneles || [];

            this.panelesCurrentPage = 1;

            this.renderPaneles();

        } catch (error) {

            console.error(
                'Error obteniendo paneles:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="text-center text-danger">
                        Error al obtener paneles.
                    </td>
                </tr>
            `;

        }

    }

    // =====================================================
    // RENDER PANELES
    // =====================================================
    renderPaneles() {

        const tbody =
            this.querySelector(
                '#tb-paneles'
            );

        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.paneles.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="2"
                        class="text-center text-muted">
                        No hay paneles registrados.
                    </td>
                </tr>
            `;

            this.actualizarPaginacionPaneles();

            return;

        }

        const start =
            (this.panelesCurrentPage - 1) *
            this.panelesPerPage;

        const end =
            start +
            this.panelesPerPage;

        const panelesPagina =
            this.paneles.slice(
                start,
                end
            );

        panelesPagina.forEach(panel => {

            const tr =
                document.createElement('tr');

            tr.dataset.id = panel.id;

            tr.innerHTML = `
                <td>
                    ${panel.nombre || panel.panel || '-'}
                </td>

                <td class="text-center">

                    <div class="action-btn-group">

                        <button
                            class="btn-action edit"
                            title="Editar"
                            type="button">

                            <i class="bi bi-pencil"></i>

                        </button>

                        <button
                            class="btn-action delete"
                            title="Eliminar"
                            type="button">

                            <i class="bi bi-trash"></i>

                        </button>

                    </div>

                </td>
            `;

            // EDITAR
            const btnEdit =
                tr.querySelector(
                    '.btn-action.edit'
                );

            btnEdit.addEventListener(
                'click',
                () => this.abrirDialogoEditar(
                    'panel',
                    panel
                )
            );

            // ELIMINAR
            const btnDelete =
                tr.querySelector(
                    '.btn-action.delete'
                );

            btnDelete.addEventListener(
                'click',
                () => this.abrirDialogoEliminar(
                    'panel',
                    panel
                )
            );

            tbody.appendChild(tr);

        });

        this.actualizarPaginacionPaneles();

    }

    // =====================================================
    // PAGINACIÓN PANELES
    // =====================================================
    actualizarPaginacionPaneles() {

        const total =
            this.paneles.length;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.panelesPerPage
                )
            );

        const start =
            total === 0
                ? 0
                : (
                    (this.panelesCurrentPage - 1) *
                    this.panelesPerPage
                ) + 1;

        const end =
            Math.min(
                this.panelesCurrentPage *
                this.panelesPerPage,
                total
            );

        const info =
            this.querySelector(
                '#paneles-page-info'
            );

        const pageNumber =
            this.querySelector(
                '#paneles-page-number'
            );

        const prev =
            this.querySelector(
                '#paneles-prev'
            );

        const next =
            this.querySelector(
                '#paneles-next'
            );

        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }

        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.panelesCurrentPage} de ${totalPages}`;

        }

        if (prev) {

            prev.disabled =
                this.panelesCurrentPage <= 1;

        }

        if (next) {

            next.disabled =
                this.panelesCurrentPage >= totalPages;

        }

    }

    // =========================================================
    // CREAR MÓDULO / PANEL
    // =========================================================
    abrirDialogoCrear(tipo) {

        const esModulo = tipo === 'modulo';
        const titulo = esModulo ? 'Agregar módulo' : 'Agregar panel';
        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `

            <div class="dialog-header">
                <h2>${titulo}</h2>
            </div>

            <form class="dialog-form">
                <div class="form-group">
                    <label for="dialog-nombre">Nombre</label>
                    <input
                        id="dialog-nombre"
                        type="text"
                        class="form-control"
                        maxlength="50"
                        autocomplete="off"
                        required>
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

        const form = dialog.querySelector('.dialog-form');
        const input = dialog.querySelector('#dialog-nombre');
        const btnCancel = dialog.querySelector('.dialog-cancel');

        btnCancel.addEventListener(
            'click',
            () => dialog.close()
        );

        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();

                const nombre = input.value.trim();

                if (!nombre) {
                    input.focus();
                    return;
                }

                try {
                    const endpoint = esModulo ? '/modulos' : '/paneles';

                    await ApiClient.post(
                        endpoint,
                        {
                            nombre: nombre
                        }
                    );

                    dialog.close();

                    if (esModulo) {
                        await this.cargarModulosRol();
                    } else {
                        await this.cargarPanelesRol();
                    }

                } catch (error) {
                    console.error(
                        `Error creando ${tipo}:`,
                        error
                    );
                    alert(
                        `No se pudo crear el ${esModulo ? 'módulo' : 'panel'}.`
                    );
                }
            }
        );

        document.body.appendChild(dialog);
        dialog.showModal();
        input.focus();

        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

    }

    // =========================================================
    // EDITAR MÓDULO / PANEL
    // =========================================================
    abrirDialogoEditar(tipo, elemento) {

        const esModulo = tipo === 'modulo';
        const titulo = esModulo ? 'Editar módulo' : 'Editar panel';
        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `

            <div class="dialog-header">
                <h2>${titulo}</h2>
            </div>

            <form class="dialog-form">
                <div class="form-group">
                    <label for="dialog-nombre">Nombre</label>
                    <input
                        id="dialog-nombre"
                        type="text"
                        class="form-control"
                        maxlength="50"
                        autocomplete="off"
                        value="${this.escapeHtml(elemento.nombre || '')}"
                        required>
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

        const form = dialog.querySelector('.dialog-form');
        const input = dialog.querySelector('#dialog-nombre');
        const btnCancel = dialog.querySelector('.dialog-cancel');

        btnCancel.addEventListener(
            'click',
            () => dialog.close()
        );

        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();

                const nombre = input.value.trim();

                if (!nombre) {
                    input.focus();
                    return;
                }

                try {
                    const endpoint = esModulo ? `/modulos/${elemento.id}` : `/paneles/${elemento.id}`;

                    await ApiClient.put(
                        endpoint,
                        {
                            nombre: nombre
                        }
                    );

                    dialog.close();

                    if (esModulo) {
                        await this.cargarModulosRol();
                    } else {
                        await this.cargarPanelesRol();
                    }

                } catch (error) {
                    console.error(
                        `Error editando ${tipo}:`,
                        error
                    );
                    alert(
                        `No se pudo editar el ${esModulo ? 'módulo' : 'panel'}.`
                    );
                }
            }
        );


        document.body.appendChild(dialog);
        dialog.showModal();
        input.focus();

        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

    }

    // =========================================================
    // ELIMINAR MÓDULO / PANEL
    // =========================================================
    abrirDialogoEliminar(tipo, elemento) {

        const esModulo = tipo === 'modulo';
        const nombreTipo = esModulo ? 'módulo' : 'panel';
        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `

            <div class="dialog-header">
                <h2>Eliminar ${nombreTipo}</h2>
            </div>

            <div class="dialog-content">
                <p>
                    ¿Desea eliminar el ${nombreTipo}
                    <strong>${this.escapeHtml(elemento.nombre)}</strong>?
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

        const btnCancel = dialog.querySelector('.dialog-cancel');
        const btnDelete = dialog.querySelector('.dialog-confirm-delete');

        btnCancel.addEventListener(
            'click',
            () => dialog.close()
        );

        btnDelete.addEventListener(
            'click',
            async () => {
                try {
                    const endpoint =
                        esModulo ? `/modulos/${elemento.id}` : `/paneles/${elemento.id}`;
                    await ApiClient.delete(endpoint);

                    dialog.close();

                    if (esModulo) {
                        await this.cargarModulosRol();
                    } else {
                        await this.cargarPanelesRol();
                    }

                } catch (error) {
                    console.error(
                        `Error eliminando ${tipo}:`,
                        error
                    );
                    alert(
                        `No se pudo eliminar el ${nombreTipo}.`
                    );
                }
            }
        );

        document.body.appendChild(dialog);
        dialog.showModal();

        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

    }

    // CREAR/ EDITAR ROL
    async abrirDialogoCrearRol() {
        await this.abrirDialogoRol();
    }

    async abrirDialogoEditarRol(rol) {
        await this.abrirDialogoRol(rol);
    }

    async abrirDialogoVerRol(rol) {
        await this.abrirDialogoRol(rol, true);
    }  

    // DIALOG PRINCIPAL DE ROL
    async abrirDialogoRol(
        rol = null,
        soloLectura = false
    ) {

        const esEdicion = rol !== null;

        let modulos = [];
        let paneles = [];
        let modulosAsignados = [];
        let panelesAsignados = [];

        try {

            // Obtener todos los módulos y paneles disponibles
            const [respuestaModulos, respuestaPaneles] = await Promise.all([
                ApiClient.get('/modulos'),
                ApiClient.get('/paneles')
            ]);

            modulos = respuestaModulos || [];
            paneles = respuestaPaneles || [];

            // Si estamos editando, obtener las asociaciones actuales
            if (esEdicion) {

                const [
                    respuestaModulosAsignados,
                    respuestaPanelesAsignados
                ] = await Promise.all([
                    ApiClient.get(`/roles/${rol.id}/modulos`),
                    ApiClient.get(`/roles/${rol.id}/paneles`)
                ]);

                modulosAsignados = respuestaModulosAsignados || [];
                panelesAsignados = respuestaPanelesAsignados || [];
            }

        } catch (error) {

            console.error('Error cargando datos del rol:', error);

            alert('No se pudieron cargar los módulos y paneles.');

            return;
        }

        const dialog = this.crearDialogoBase();

        dialog.classList.add('role-dialog');

        const titulo = soloLectura
            ? 'Ver rol'
            : esEdicion
                ? 'Editar rol'
                : 'Agregar rol';

        const nombreInicial = esEdicion
            ? (rol.nombre || '')
            : '';

        const duracionInicial = esEdicion
            ? (rol.duracion_token ?? '')
            : '';

        // Mapa de módulos ya asignados
        const modulosMap = new Map();

        modulosAsignados.forEach(modulo => {

            modulosMap.set(
                Number(modulo.id_modulo),
                modulo
            );

        });

        // IDs de paneles asignados
        const panelesAsignadosSet = new Set(
            panelesAsignados.map(panel =>
                Number(panel.id_panel)
            )
        );

        const filasModulos = modulos.map(modulo => {

            const idModulo = Number(modulo.id);

            const asignado = modulosMap.get(idModulo);

            const leer = asignado?.leer === true;
            const escribir = asignado?.escribir === true;
            const editar = asignado?.editar === true;

            return `
                <tr data-modulo-id="${idModulo}">

                    <td>
                        ${this.escapeHtml(
                            modulo.nombre ||
                            modulo.modulo ||
                            '-'
                        )}
                    </td>

                    <td class="text-center">
                        <input 
                            type="checkbox" 
                            data-permiso="leer" 
                            ${leer ? 'checked' : ''} 
                            ${soloLectura ? 'disabled' : ''}
                        >
                    </td>

                    <td class="text-center">
                        <input 
                            type="checkbox" 
                            data-permiso="escribir" 
                            ${escribir ? 'checked' : ''} 
                            ${soloLectura ? 'disabled' : ''}
                        >
                    </td>

                    <td class="text-center">
                        <input 
                            type="checkbox" 
                            data-permiso="editar" 
                            ${editar ? 'checked' : ''} 
                            ${soloLectura ? 'disabled' : ''}
                        >
                    </td>

                </tr>
            `;
        }).join('');

        const filasPaneles = paneles.map(panel => {

            const idPanel = Number(panel.id);

            const seleccionado =
                panelesAsignadosSet.has(idPanel);

            return `
                <tr data-panel-id="${idPanel}">

                    <td>
                        ${this.escapeHtml(
                            panel.nombre ||
                            panel.panel ||
                            '-'
                        )}
                    </td>

                    <td class="text-center">
                        <input 
                            type="checkbox" 
                            data-permiso="ver" 
                            ${seleccionado ? 'checked' : ''} 
                            ${soloLectura ? 'disabled' : ''}
                        >
                    </td>

                </tr>
            `;
        }).join('');

        dialog.innerHTML = `

            <div class="dialog-header">

                <h2>${titulo}</h2>

            </div>

            <form class="dialog-form role-dialog-form">

                <div class="role-dialog-scroll">

                    <!-- DATOS DEL ROL -->

                    <div class="form-group">

                        <label for="rol-nombre">
                            Nombre del rol
                        </label>

                        <input 
                            type="text" 
                            id="rol-nombre" 
                            class="form-control" 
                            value="${this.escapeHtml(nombreInicial)}" 
                            maxlength="100" 
                            ${soloLectura ? 'disabled' : 'required'}
                        >

                    </div>

                    <div class="form-group">

                        <label for="rol-token">
                            Duración del token
                        </label>

                        <input 
                            type="number" 
                            id="rol-token" 
                            class="form-control" 
                            value="${duracionInicial}" 
                            min="1" 
                            ${soloLectura ? 'disabled' : 'required'}
                        >

                    </div>


                    <!-- PERMISOS POR MÓDULO -->
                    <div class="permissions-section">

                        <h3>
                            Permisos por Módulo
                        </h3>

                        <div class="permissions-table-wrapper">

                            <table class="permissions-table">

                                <thead>

                                    <tr>
                                        <th>MÓDULO</th>
                                        <th>LEER</th>
                                        <th>ESCRIBIR</th>
                                        <th>EDITAR</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    ${
                                        filasModulos ||
                                        `
                                        <tr>
                                            <td colspan="4"
                                                class="text-center text-muted">
                                                No hay módulos disponibles.
                                            </td>
                                        </tr>
                                        `
                                    }

                                </tbody>

                            </table>

                        </div>

                    </div>


                    <!-- PERMISOS POR PANEL -->

                    <div class="permissions-section">

                        <h3>
                            Permisos por panel
                        </h3>

                        <div class="permissions-table-wrapper">

                            <table class="permissions-table">

                                <thead>

                                    <tr>
                                        <th>PANEL</th>
                                        <th>VER</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    ${
                                        filasPaneles ||
                                        `
                                        <tr>
                                            <td colspan="2"
                                                class="text-center text-muted">
                                                No hay paneles disponibles.
                                            </td>
                                        </tr>
                                        `
                                    }

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>


                <!-- BOTONES -->
                <div class="dialog-actions">

                    <button 
                        type="button" 
                        class="btn btn-secondary dialog-cancel" 
                        id="btn-cancelar-rol">
                        ${soloLectura ? 'Cerrar' : 'Cancelar'}
                    </button>

                    ${
                        soloLectura
                            ? ''
                            : `
                                <button 
                                    type="submit" 
                                    class="btn btn-primary">
                                    ${esEdicion ? 'Guardar cambios' : 'Guardar'}
                                </button>
                            `
                    }

                </div>

            </form>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('.role-dialog-form');

        const btnCancelar =
            dialog.querySelector('#btn-cancelar-rol');

        btnCancelar.addEventListener('click', () => {
            dialog.close();
        });

        form.addEventListener('submit', async (event) => {

            event.preventDefault();

            await this.guardarRol(
                dialog,
                rol
            );

        });

        dialog.addEventListener('close', () => {
            dialog.remove();
        });

        dialog.showModal();
    }

    // GUARDAR ROL
    async guardarRol(dialog, rol) {

        const nombre =
            dialog.querySelector('#rol-nombre').value.trim();

        const duracionToken =
            Number(
                dialog.querySelector('#rol-token').value
            );

        if (!nombre) {
            alert('Debe ingresar el nombre del rol.');
            return;
        }

        if (!duracionToken || duracionToken <= 0) {
            alert('Debe ingresar una duración de token válida.');
            return;
        }

        const esEdicion = rol !== null;

        try {

            let idRol;

            // ==========================================
            // 1. CREAR / ACTUALIZAR ROL
            // ==========================================

            if (!esEdicion) {

                const respuesta = await ApiClient.post(
                    '/roles',
                    {
                        nombre: nombre,
                        token_duracion: duracionToken
                    }
                );

                idRol = respuesta.id;

                if (!idRol) {
                    throw new Error(
                        'La API no devolvió el ID del rol creado.'
                    );
                }

            } else {

                idRol = rol.id;

                await ApiClient.put(
                    `/roles/${idRol}`,
                    {
                        nombre: nombre,
                        token_duracion: duracionToken
                    }
                );
            }


            // ==========================================
            // 2. OBTENER PERMISOS SELECCIONADOS
            // ==========================================

            const filasModulos =
                [...dialog.querySelectorAll(
                    'tr[data-modulo-id]'
                )];

            const filasPaneles =
                [...dialog.querySelectorAll(
                    'tr[data-panel-id]'
                )];


            // ==========================================
            // 3. MÓDULOS
            // ==========================================

            let modulosActuales = [];

            if (esEdicion) {

                modulosActuales =
                    await ApiClient.get(
                        `/roles/${idRol}/modulos`
                    );

            }

            const modulosActualesMap = new Map();

            modulosActuales.forEach(modulo => {

                modulosActualesMap.set(
                    Number(modulo.id_modulo),
                    modulo
                );

            });


            for (const fila of filasModulos) {

                const idModulo =
                    Number(
                        fila.dataset.moduloId
                    );

                const leer =
                    fila.querySelector(
                        '[data-permiso="leer"]'
                    ).checked;

                const escribir =
                    fila.querySelector(
                        '[data-permiso="escribir"]'
                    ).checked;

                const editar =
                    fila.querySelector(
                        '[data-permiso="editar"]'
                    ).checked;

                const existente =
                    modulosActualesMap.get(idModulo);


                if (existente) {

                    // Ya existe → actualizar permisos

                    await ApiClient.put(
                        `/roles/${idRol}/modulos/${idModulo}`,
                        {
                            leer: leer,
                            escribir: escribir,
                            editar: editar
                        }
                    );

                } else {

                    // No existe → crear asociación

                    await ApiClient.post(
                        `/roles/${idRol}/modulos`,
                        {
                            id_modulo: idModulo,
                            leer: leer,
                            escribir: escribir,
                            editar: editar
                        }
                    );
                }
            }


            // ==========================================
            // 4. PANELES
            // ==========================================

            let panelesActuales = [];

            if (esEdicion) {

                panelesActuales =
                    await ApiClient.get(
                        `/roles/${idRol}/paneles`
                    );

            }

            const panelesActualesSet =
                new Set(
                    panelesActuales.map(panel =>
                        Number(panel.id_panel)
                    )
                );


            for (const fila of filasPaneles) {

                const idPanel =
                    Number(
                        fila.dataset.panelId
                    );

                const seleccionado =
                    fila.querySelector(
                        '[data-permiso="ver"]'
                    ).checked;

                const estabaAsignado =
                    panelesActualesSet.has(idPanel);


                if (seleccionado && !estabaAsignado) {

                    // Marcar VER
                    await ApiClient.post(
                        `/roles/${idRol}/paneles`,
                        {
                            id_panel: idPanel
                        }
                    );

                } else if (!seleccionado && estabaAsignado) {

                    // Quitar VER
                    await ApiClient.delete(
                        `/roles/${idRol}/paneles/${idPanel}`
                    );
                }
            }


            // ==========================================
            // 5. FINALIZAR
            // ==========================================

            dialog.close();

            await this.recargarTodo();

            alert(
                esEdicion
                    ? 'Rol actualizado correctamente.'
                    : 'Rol creado correctamente.'
            );

        } catch (error) {

            console.error(
                'Error guardando rol:',
                error
            );

            alert(
                'No se pudo guardar el rol. ' +
                'Verificá los datos e intentá nuevamente.'
            );
        }
    }

    // =========================================================
    // ELIMINAR ROL
    // =========================================================
    async abrirDialogoEliminarRol(rol) {

        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `

            <div class="dialog-header">
                <h2>Eliminar rol</h2>
            </div>

            <div class="dialog-content">

                <p>
                    ¿Desea eliminar el rol
                    <strong>${this.escapeHtml(rol.nombre)}</strong>?
                </p>

            </div>

            <div class="dialog-actions">

                <button
                    type="button"
                    class="btn btn-secondary dialog-cancel"
                    id="btn-cancelar-eliminar-rol">
                    Cancelar
                </button>

                <button
                    type="button"
                    class="btn btn-danger dialog-confirm-delete"
                    id="btn-confirmar-eliminar-rol">
                    Eliminar
                </button>

            </div>
        `;

        document.body.appendChild(dialog);

        // CANCELAR
        const btnCancelar =
            dialog.querySelector(
                '#btn-cancelar-eliminar-rol'
            );

        btnCancelar.addEventListener(
            'click',
            () => {
                dialog.close();
            }
        );

        // CONFIRMAR ELIMINACIÓN
        const btnConfirmar =
            dialog.querySelector(
                '#btn-confirmar-eliminar-rol'
            );

        btnConfirmar.addEventListener(
            'click',
            async () => {

                try {

                    await ApiClient.delete(
                        `/roles/${rol.id}`
                    );

                    dialog.close();

                    this.selectedRolId = null;

                    await this.recargarTodo();

                } catch (error) {

                    console.error(
                        'Error eliminando rol:',
                        error
                    );

                    alert(
                        'No se pudo eliminar el rol.'
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

    // =========================================================
    // CREAR DIALOG BASE
    // =========================================================
    crearDialogoBase() {
        const dialog = document.createElement('dialog');
        dialog.classList.add('custom-dialog');
        return dialog;
    }


    // =========================================================
    // ESCAPAR HTML
    // =========================================================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}

// =========================================================
// REGISTRAR COMPONENTE
// =========================================================
customElements.define(
    'app-roles',
    RolesComponent
);