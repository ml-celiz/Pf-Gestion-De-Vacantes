class GestionVacantesComponent extends HTMLElement {
    constructor() {
        super();

        // CANTIDAD POR PÁGINA
        this.vacantesPerPage = 10;
        this.catedrasPerPage = 3;
        this.departamentosPerPage = 3;

        // DATOS
        this.vacantes = [];
        this.catedras = [];
        this.departamentos = [];
        this.usuariosJfc = [];
        this.estados = [];

        // PÁGINAS ACTUALES
        this.vacantesCurrentPage = 1;
        this.catedrasCurrentPage = 1;
        this.departamentosCurrentPage = 1;
    }

    // INICIALIZACIÓN
    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/configuraciones/gestion-vacantes/gestion-vacantes.css');

            const response = await fetch(
                'components/configuraciones/gestion-vacantes/gestion-vacantes.html'
            );

            if (!response.ok) {
                throw new Error('Error al cargar vista de gestión de vacantes.');
            }

            const html = await response.text();

            await estilos;

            this.innerHTML = html;

            this.initEvents();

            // Cargar las tres tablas
            await Promise.all([
                this.cargarVacantes(),
                this.cargarCatedras(),
                this.cargarDepartamentos(),
                this.cargarUsuariosJfc(),
                this.cargarEstados()
            ]);
        } catch (error) {
            console.error('Error inicializando <app-gestion-vacantes>:', error);
        }
    }

    // EVENTOS
    initEvents() {
        // REFRESCAR
        const btnRefresh = this.querySelector('#btn-refresh');

        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.recargarTodo());
        }

        // AGREGAR VACANTE
        const btnAddVacante = this.querySelector('#btn-add-vacante');

        if (btnAddVacante) {
            btnAddVacante.addEventListener('click', () => {
                this.abrirDialogoVacante();
            });
        }

        // AGREGAR CÁTEDRA
        const btnAddCatedra = this.querySelector('#btn-add-catedra');

        if (btnAddCatedra) {
            btnAddCatedra.addEventListener('click', () => {
                this.abrirDialogoCatedra();
            });
        }

        // AGREGAR DEPARTAMENTO
        const btnAddDepartamento = this.querySelector('#btn-add-departamento');

        if (btnAddDepartamento) {
            btnAddDepartamento.addEventListener('click', () => {
                this.abrirDialogoDepartamento();
            });
        }

        // PAGINACIÓN VACANTES
        const vacantesPrev = this.querySelector('#vacantes-prev');
        const vacantesNext = this.querySelector('#vacantes-next');

        if (vacantesPrev) {
            vacantesPrev.addEventListener('click', () => {
                if (this.vacantesCurrentPage > 1) {
                    this.vacantesCurrentPage--;
                    this.renderVacantes();
                }
            });
        }

        if (vacantesNext) {
            vacantesNext.addEventListener('click', () => {
                const totalPages = Math.ceil(this.vacantes.length / this.vacantesPerPage);

                if (this.vacantesCurrentPage < totalPages) {
                    this.vacantesCurrentPage++;
                    this.renderVacantes();
                }
            });
        }

        // PAGINACIÓN CÁTEDRAS
        const catedrasPrev = this.querySelector('#catedras-prev');
        const catedrasNext = this.querySelector('#catedras-next');

        if (catedrasPrev) {
            catedrasPrev.addEventListener('click', () => {
                if (this.catedrasCurrentPage > 1) {
                    this.catedrasCurrentPage--;

                    this.renderCatedras();
                }
            });
        }

        if (catedrasNext) {
            catedrasNext.addEventListener('click', () => {
                const totalPages = Math.ceil(this.catedras.length / this.catedrasPerPage);

                if (this.catedrasCurrentPage < totalPages) {
                    this.catedrasCurrentPage++;

                    this.renderCatedras();
                }
            });
        }

        // PAGINACIÓN DEPARTAMENTOS
        const departamentosPrev = this.querySelector('#departamentos-prev');
        const departamentosNext = this.querySelector('#departamentos-next');

        if (departamentosPrev) {
            departamentosPrev.addEventListener('click', () => {
                if (this.departamentosCurrentPage > 1) {
                    this.departamentosCurrentPage--;

                    this.renderDepartamentos();
                }
            });
        }

        if (departamentosNext) {
            departamentosNext.addEventListener('click', () => {
                const totalPages = Math.ceil(this.departamentos.length / this.departamentosPerPage);

                if (this.departamentosCurrentPage < totalPages) {
                    this.departamentosCurrentPage++;

                    this.renderDepartamentos();
                }
            });
        }
    }

    // RECARGAR TODO
    async recargarTodo() {
        this.vacantesCurrentPage = 1;
        this.catedrasCurrentPage = 1;
        this.departamentosCurrentPage = 1;

        await Promise.all([
            this.cargarVacantes(),
            this.cargarCatedras(),
            this.cargarDepartamentos(),
            this.cargarUsuariosJfc(),
            this.cargarEstados()
        ]);
    }

    // VACANTES
    // GET /api/vacantes
    async cargarVacantes() {
        const tbody = this.querySelector('#tb-vacantes');

        if (!tbody) {
            console.error('No se encontró #tb-vacantes');

            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Cargando vacantes...</td>
            </tr>
        `;

        try {
            const vacantes = await ApiClient.get('/vacantes');
            this.vacantes = vacantes || [];
            this.renderVacantes();
        } catch (error) {
            console.error('Error cargando vacantes:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">Error al cargar vacantes.</td>
                </tr>
            `;
        }
    }

    // RENDER VACANTES
    renderVacantes() {
        const tbody = this.querySelector('#tb-vacantes');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.vacantes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">No hay vacantes registradas.</td>
                </tr>
            `;

            this.actualizarPaginacionVacantes();

            return;
        }

        const start = (this.vacantesCurrentPage - 1) * this.vacantesPerPage;
        const end = start + this.vacantesPerPage;
        const vacantesPagina = this.vacantes.slice(start, end);

        vacantesPagina.forEach(vacante => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${vacante.titulo || '-'}</td>
                <td>${vacante.descripcion || '-'}</td>

                <td class="text-center">
                    <button class="btn-action view" title="Ver requisitos" type="button">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                </td>

                <td>${this.formatearFecha(vacante.inicio)}</td>
                <td>${this.formatearFecha(vacante.fin)}</td>
                <td>${vacante.estado || '-'}</td>
                <td>${vacante.catedra || '-'}</td>

                <td class="text-center">
                    <div class="action-btn-group">
                        <button class="btn-action edit" title="Editar" type="button">
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button class="btn-action delete" title="Eliminar" type="button">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);

            // VER REQUISITOS
            const btnRequisitos = tr.querySelector('.btn-action.view');

            if (btnRequisitos) {
                btnRequisitos.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.mostrarRequisitos(vacante.requisitos);
                });
            }

            // EDITAR
            const btnEdit = tr.querySelector('.btn-action.edit');

            if (btnEdit) {
                btnEdit.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.abrirDialogoVacante(vacante);
                });
            }

            // ELIMINAR
            const btnDelete = tr.querySelector('.btn-action.delete');

            if (btnDelete) {
                btnDelete.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.abrirDialogoEliminar('vacante', vacante);
                });
            }
        });

        this.actualizarPaginacionVacantes();
    }

    // PAGINACIÓN VACANTES
    actualizarPaginacionVacantes() {
        const total = this.vacantes.length;
        const totalPages = Math.max(1, Math.ceil(total / this.vacantesPerPage));

        const start =
            total === 0
                ? 0
                :
                ((this.vacantesCurrentPage - 1) * this.vacantesPerPage) + 1;

        const end = Math.min(this.vacantesCurrentPage * this.vacantesPerPage, total);
        const info = this.querySelector('#vacantes-page-info');
        const pageNumber = this.querySelector('#vacantes-page-number');
        const prev = this.querySelector('#vacantes-prev');
        const next = this.querySelector('#vacantes-next');

        if (info) {
            info.textContent =
                `${start} - ${end} de ${total}`;
        }

        if (pageNumber) {
            pageNumber.textContent =
                `Página ${this.vacantesCurrentPage} de ${totalPages}`;
        }

        if (prev) {
            prev.disabled = this.vacantesCurrentPage <= 1;
        }

        if (next) {
            next.disabled = this.vacantesCurrentPage >= totalPages;
        }
    }

    // CARGAR USUARIOS JEFES DE CATEDRA
    async cargarUsuariosJfc() {
        try {
            const usuarios = await ApiClient.get('/institucional/usuarios-jfc');

            this.usuariosJfc = usuarios || [];
        } catch (error) {
            console.error('Error obteniendo usuarios JFC:', error);

            this.usuariosJfc = [];
        }
    }

    // CARGAR ESTADOS
    async cargarEstados() {
        try {
            const estados = await ApiClient.get('/vacantes/estados');

            this.estados = estados || [];
        } catch (error) {
            console.error('Error obteniendo estados:', error);

            this.estados = [];
        }
    }

    // CÁTEDRAS
    // GET /api/institucional/catedras
    async cargarCatedras() {
        const tbody = this.querySelector('#tb-catedras');

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">Cargando...</td>
            </tr>
        `;

        try {
            const catedras = await ApiClient.get('/institucional/catedras');
            this.catedras = catedras || [];
            this.renderCatedras();
        } catch (error) {
            console.error('Error obteniendo cátedras:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">Error al obtener cátedras.</td>
                </tr>
            `;
        }
    }

    // RENDER CÁTEDRAS
    renderCatedras() {
        const tbody = this.querySelector('#tb-catedras');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.catedras.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        No hay cátedras registradas.
                    </td>
                </tr>
            `;

            this.actualizarPaginacionCatedras();

            return;
        }

        const start = (this.catedrasCurrentPage - 1) * this.catedrasPerPage;
        const end = start + this.catedrasPerPage;
        const catedrasPagina = this.catedras.slice(start, end);

        catedrasPagina.forEach(catedra => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${catedra.nombre || '-'}</td>
                <td>${catedra.departamento || '-'}</td>

                <td class="text-center">
                    <div class="action-btn-group">
                        <button class="btn-action edit" title="Editar" type="button">
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button class="btn-action delete" title="Eliminar" type="button">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);

            const btnEdit = tr.querySelector('.btn-action.edit');

            if (btnEdit) {
                btnEdit.addEventListener('click', () => this.abrirDialogoCatedra(catedra));
            }

            const btnDelete = tr.querySelector('.btn-action.delete');

            if (btnDelete) {
                btnDelete.addEventListener(
                    'click',
                    () => this.abrirDialogoEliminar('catedra', catedra)
                );
            }
        });

        this.actualizarPaginacionCatedras();
    }

    // PAGINACIÓN CÁTEDRAS
    actualizarPaginacionCatedras() {
        const total = this.catedras.length;
        const totalPages = Math.max(1, Math.ceil(total / this.catedrasPerPage));

        const start =
            total === 0
                ? 0
                :
                ((this.catedrasCurrentPage - 1) * this.catedrasPerPage) + 1;

        const end = Math.min(this.catedrasCurrentPage * this.catedrasPerPage, total);
        const info = this.querySelector('#catedras-page-info');
        const pageNumber = this.querySelector('#catedras-page-number');
        const prev = this.querySelector('#catedras-prev');
        const next = this.querySelector('#catedras-next');

        if (info) {
            info.textContent =
                `${start} - ${end} de ${total}`;
        }

        if (pageNumber) {
            pageNumber.textContent =
                `Página ${this.catedrasCurrentPage} de ${totalPages}`;
        }

        if (prev) {
            prev.disabled = this.catedrasCurrentPage <= 1;
        }

        if (next) {
            next.disabled = this.catedrasCurrentPage >= totalPages;
        }
    }

    // DEPARTAMENTOS
    // GET /api/institucional/departamentos
    async cargarDepartamentos() {
        const tbody = this.querySelector('#tb-departamentos');

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center">Cargando...</td>
            </tr>
        `;

        try {
            const departamentos = await ApiClient.get('/institucional/departamentos');
            this.departamentos = departamentos || [];
            this.renderDepartamentos();
        } catch (error) {
            console.error('Error obteniendo departamentos:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger">
                        Error al obtener departamentos.
                    </td>
                </tr>
            `;
        }
    }

    // RENDER DEPARTAMENTOS
    renderDepartamentos() {
        const tbody = this.querySelector('#tb-departamentos');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.departamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">
                        No hay departamentos registrados.
                    </td>
                </tr>
            `;

            this.actualizarPaginacionDepartamentos();

            return;
        }

        const start = (this.departamentosCurrentPage - 1) * this.departamentosPerPage;
        const end = start + this.departamentosPerPage;
        const departamentosPagina = this.departamentos.slice(start, end);

        departamentosPagina.forEach(departamento => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${departamento.nombre || '-'}</td>

                <td class="text-center">
                    <div class="action-btn-group">
                        <button class="btn-action edit" title="Editar" type="button">
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button class="btn-action delete" title="Eliminar" type="button">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);

            const btnEdit = tr.querySelector('.btn-action.edit');

            if (btnEdit) {
                btnEdit.addEventListener(
                    'click',
                    () => this.abrirDialogoDepartamento(departamento)
                );
            }

            const btnDelete = tr.querySelector('.btn-action.delete');

            if (btnDelete) {
                btnDelete.addEventListener(
                    'click',
                    () => this.abrirDialogoEliminar('departamento', departamento)
                );
            }
        });

        this.actualizarPaginacionDepartamentos();
    }

    // PAGINACIÓN DEPARTAMENTOS
    actualizarPaginacionDepartamentos() {
        const total = this.departamentos.length;
        const totalPages = Math.max(1, Math.ceil(total / this.departamentosPerPage));

        const start =
            total === 0
                ? 0
                :
                ((this.departamentosCurrentPage - 1) * this.departamentosPerPage) + 1;

        const end = Math.min(this.departamentosCurrentPage * this.departamentosPerPage, total);
        const info = this.querySelector('#departamentos-page-info');
        const pageNumber = this.querySelector('#departamentos-page-number');
        const prev = this.querySelector('#departamentos-prev');
        const next = this.querySelector('#departamentos-next');

        if (info) {
            info.textContent =
                `${start} - ${end} de ${total}`;
        }

        if (pageNumber) {
            pageNumber.textContent =
                `Página ${this.departamentosCurrentPage} de ${totalPages}`;
        }

        if (prev) {
            prev.disabled = this.departamentosCurrentPage <= 1;
        }

        if (next) {
            next.disabled = this.departamentosCurrentPage >= totalPages;
        }
    }

    // MOSTRAR REQUISITOS
    mostrarRequisitos(requisitos) {
        let datos = requisitos;

        if (!datos) {
            datos = {};
        }

        if (typeof datos === 'string') {
            try {
                datos = JSON.parse(datos);
            } catch (error) {
                console.error('Error interpretando requisitos:', error);

                datos = {
                    requisitos: datos
                };
            }
        }

        const dialog = document.createElement('div');

        dialog.className = 'requisitos-dialog-overlay';

        dialog.innerHTML = `
            <div class="requisitos-dialog" role="dialog" aria-modal="true">
                <div class="requisitos-dialog-header">
                    <h2>Requisitos</h2>

                    <button class="btn-close-dialog" type="button" title="Cerrar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <div class="requisitos-dialog-body">${this.generarRequisitosHTML(datos)}</div>
            </div>
        `;

        document.body.appendChild(dialog);

        const cerrar = () => {
            dialog.remove();
        };

        const btnCerrar = dialog.querySelector('.btn-close-dialog');
        const btnCerrarFooter = dialog.querySelector('.btn-dialog-close');

        btnCerrar.addEventListener('click', cerrar);

        btnCerrarFooter.addEventListener('click', cerrar);

        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                cerrar();
            }
        });
    }

    // GENERAR HTML DE REQUISITOS
    generarRequisitosHTML(datos) {
        if (!datos || typeof datos !== 'object') {
            return `
                <p class="requisitos-empty">No hay requisitos registrados.</p>
            `;
        }

        return Object.entries(datos)
            .map(([clave, valor]) => {
                const titulo = this.formatearTituloRequisito(clave);
                let contenido = '';

                if (Array.isArray(valor)) {
                    contenido = `
                        <ul class="requisitos-list">
                            ${valor.map(item => `
                                <li>${item}</li>
                            `).join('')}
                        </ul>
                    `;
                } else {
                    contenido = `
                        <p class="requisito-text">${valor || '-'}</p>
                    `;
                }

                return `
                    <div class="requisito-group">
                        <h3>${titulo}</h3>

                        ${contenido}
                    </div>
                `;
            })
            .join('');
    }

    // FORMATEAR TÍTULO DE REQUISITO
    formatearTituloRequisito(clave) {
        return clave
            .replace(/_/g, ' ')
            .replace(/\b\w/g, letra => letra.toUpperCase());
    }

    // FORMATEAR FECHA
    formatearFecha(fecha) {
        if (!fecha) {
            return '-';
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return fecha;
        }

        return date.toLocaleDateString(
            'es-AR',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        );
    }

    // HELPERS
    crearDialogoBase() {
        const dialog = document.createElement('dialog');
        dialog.classList.add('custom-dialog');
        return dialog;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }

    // DIALOG DEPARTAMENTOS
    abrirDialogoDepartamento(departamento = null) {
        const esEdicion = departamento !== null;
        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>
                    ${esEdicion
                        ? 'Editar departamento'
                        : 'Agregar departamento'}
                </h2>
            </div>

            <form class="dialog-form">
                <div class="form-group">
                    <label for="departamento-nombre">Nombre</label>

                    <input
                        type="text"
                        id="departamento-nombre"
                        class="form-control"
                        maxlength="50"
                        autocomplete="off"
                        value="${this.escapeHtml(departamento?.nombre || '')}"
                        required>
                </div>

                <div class="dialog-actions">
                    <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>

                    <button type="submit" class="btn btn-primary">
                        ${esEdicion ? 'Guardar cambios' : 'Guardar'}
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('.dialog-form');
        const input = dialog.querySelector('#departamento-nombre');
        const btnCancelar = dialog.querySelector('.dialog-cancel');

        btnCancelar.addEventListener('click', () => dialog.close());

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = input.value.trim();

            if (!nombre) {
                input.focus();
                return;
            }

            try {
                if (esEdicion) {
                    await ApiClient.put(
                        `/institucional/departamentos/${departamento.id}`,
                        {
                            nombre: nombre
                        }
                    );
                } else {
                    await ApiClient.post(
                        '/institucional/departamentos',
                        {
                            nombre: nombre
                        }
                    );
                }

                dialog.close();

                await this.cargarDepartamentos();

                this.mostrarSnackbar(
                    esEdicion
                        ? 'Departamento actualizado correctamente.'
                        : 'Departamento creado correctamente.'
                );
            } catch (error) {
                console.error('Error guardando departamento:', error);

                this.mostrarSnackbar(
                    esEdicion
                        ? 'No se pudo actualizar el departamento.'
                        : 'No se pudo crear el departamento.',
                    'error'
                );
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();

        input.focus();
    }

    // DIALOG CATEDRA
    abrirDialogoCatedra(catedra = null) {
        const esEdicion = catedra !== null;
        const dialog = this.crearDialogoBase();

        const opcionesDepartamentos =
            this.departamentos.map(departamento => `
                <option
                    value="${departamento.id}"
                    ${Number(catedra?.id_departamento) === Number(departamento.id)
                        ? 'selected'
                        : ''}>
                    ${this.escapeHtml(departamento.nombre)}
                </option>
            `).join('');

        const opcionesUsuarios =
            this.usuariosJfc.map(usuario => `
                <option
                    value="${usuario.id}"
                    ${Number(catedra?.id_usuario) === Number(usuario.id)
                        ? 'selected'
                        : ''}>
                    ${this.escapeHtml(
                        `${usuario.apellido || ''}, ${usuario.nombre || ''}`
                    )}
                </option>
            `).join('');

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>
                    ${esEdicion
                        ? 'Editar cátedra'
                        : 'Agregar cátedra'}
                </h2>
            </div>

            <form class="dialog-form">
                <div class="form-group">
                    <label for="catedra-nombre">Nombre</label>

                    <input
                        type="text"
                        id="catedra-nombre"
                        class="form-control"
                        maxlength="50"
                        autocomplete="off"
                        value="${this.escapeHtml(catedra?.nombre || '')}"
                        required>
                </div>

                <div class="form-group">
                    <label for="catedra-departamento">Departamento</label>

                    <select id="catedra-departamento" class="form-control" required>
                        <option value="">Seleccionar departamento</option>

                        ${opcionesDepartamentos}
                    </select>
                </div>

                <div class="form-group">
                    <label for="catedra-usuario">Jefe de Cátedra</label>

                    <select id="catedra-usuario" class="form-control" required>
                        <option value="">Seleccionar usuario</option>

                        ${opcionesUsuarios}
                    </select>
                </div>

                <div class="dialog-actions">
                    <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>

                    <button type="submit" class="btn btn-primary">
                        ${esEdicion
                            ? 'Guardar cambios'
                            : 'Guardar'}
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('.dialog-form');
        const inputNombre = dialog.querySelector('#catedra-nombre');
        const selectDepartamento = dialog.querySelector('#catedra-departamento');
        const selectUsuario = dialog.querySelector('#catedra-usuario');
        const btnCancelar = dialog.querySelector('.dialog-cancel');

        btnCancelar.addEventListener('click', () => dialog.close());

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = inputNombre.value.trim();
            const idDepartamento = Number(selectDepartamento.value);
            const idUsuario = Number(selectUsuario.value);

            if (!nombre) {
                inputNombre.focus();
                return;
            }

            if (!idDepartamento) {
                selectDepartamento.focus();
                return;
            }

            if (!idUsuario) {
                selectUsuario.focus();
                return;
            }

            try {
                const datos = {
                    nombre: nombre,
                    id_departamento: idDepartamento,
                    id_usuario: idUsuario
                };

                if (esEdicion) {
                    await ApiClient.put(
                        `/institucional/catedras/${catedra.id}`,
                        datos
                    );
                } else {
                    await ApiClient.post('/institucional/catedras', datos);
                }

                dialog.close();

                await this.cargarCatedras();

                this.mostrarSnackbar(
                    esEdicion
                        ? 'Cátedra actualizada correctamente.'
                        : 'Cátedra creada correctamente.'
                );
            } catch (error) {
                console.error('Error guardando cátedra:', error);

                this.mostrarSnackbar(
                    esEdicion
                        ? 'No se pudo actualizar la cátedra.'
                        : 'No se pudo crear la cátedra.',
                    'error'
                );
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();

        inputNombre.focus();
    }

    // DIALOG VACANTE
    abrirDialogoVacante(vacante = null) {
        const esEdicion = vacante !== null;
        const dialog = this.crearDialogoBase();

        // ANCHO ESPECÍFICO PARA EL DIALOG DE VACANTES
        dialog.classList.add('vacante-dialog');

        const opcionesCatedras =
            this.catedras.map(catedra => `
                <option
                    value="${catedra.id}"
                    ${Number(vacante?.id_catedra) === Number(catedra.id)
                        ? 'selected'
                        : ''}>
                    ${this.escapeHtml(catedra.nombre)}
                </option>
            `).join('');

        const opcionesEstados =
            this.estados.map(estado => `
                <option
                    value="${estado.id}"
                    ${Number(vacante?.id_estado) === Number(estado.id)
                        ? 'selected'
                        : ''}>
                    ${this.escapeHtml(estado.nombre)}
                </option>
            `).join('');

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>
                    ${esEdicion
                        ? 'Editar vacante'
                        : 'Agregar vacante'}
                </h2>
            </div>

            <form class="dialog-form">
                <!-- TÍTULO -->

                <div class="form-group">
                    <label for="vacante-titulo">Vacante</label>

                    <input
                        type="text"
                        id="vacante-titulo"
                        class="form-control"
                        maxlength="50"
                        autocomplete="off"
                        value="${this.escapeHtml(vacante?.titulo || '')}"
                        required>
                </div>

                <!-- DESCRIPCIÓN -->

                <div class="form-group">
                    <label for="vacante-descripcion">Descripción</label>

                    <textarea
                        id="vacante-descripcion"
                        class="form-control"
                        maxlength="50"
                        rows="3"
                        required>${this.escapeHtml(vacante?.descripcion || '')}</textarea>
                </div>

                <!-- CÁTEDRA + ESTADO -->

                <div class="form-row">
                    <div class="form-group">
                        <label for="vacante-catedra">Cátedra</label>

                        <select id="vacante-catedra" class="form-control" required>
                            <option value="">Seleccionar cátedra</option>

                            ${opcionesCatedras}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="vacante-estado">Estado</label>

                        <select id="vacante-estado" class="form-control" required>
                            <option value="">Seleccionar estado</option>

                            ${opcionesEstados}
                        </select>
                    </div>
                </div>

                <!-- INICIO + FIN -->

                <div class="form-row">
                    <div class="form-group">
                        <label>Inicio</label>
                        <app-datepicker id="vacante-inicio" value="${this.formatearFechaInput(vacante?.inicio)}">
                        </app-datepicker>
                    </div>

                    <div class="form-group">
                        <label>Fin</label>
                        <app-datepicker id="vacante-fin" value="${this.formatearFechaInput(vacante?.fin)}"
                            min="${this.formatearFechaInput(vacante?.inicio)}">
                        </app-datepicker>
                    </div>
                </div>

                <!-- REQUISITOS -->

                <div class="form-group">
                    <label for="vacante-requisitos">Requisitos</label>

                    <textarea
                        id="vacante-requisitos"
                        class="form-control"
                        rows="4"
                        placeholder="Ingrese un requisito por línea...">${this.formatearRequisitosInput(
                            vacante?.requisitos
                        )}</textarea>
                </div>

                <!-- BOTONES -->

                <div class="dialog-actions">
                    <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>

                    <button type="submit" class="btn btn-primary">
                        ${esEdicion
                            ? 'Guardar cambios'
                            : 'Guardar'}
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);

        // REFERENCIAS

        const form = dialog.querySelector('.dialog-form');
        const titulo = dialog.querySelector('#vacante-titulo');
        const descripcion = dialog.querySelector('#vacante-descripcion');
        const catedra = dialog.querySelector('#vacante-catedra');
        const estado = dialog.querySelector('#vacante-estado');
        const inicio = dialog.querySelector('#vacante-inicio');
        const fin = dialog.querySelector('#vacante-fin');
        const requisitos = dialog.querySelector('#vacante-requisitos');
        const btnCancelar = dialog.querySelector('.dialog-cancel');

        // CANCELAR

        btnCancelar.addEventListener('click', () => dialog.close());

        // El fin no puede ser anterior al inicio
        inicio.addEventListener('change', () => {
            fin.min = inicio.value;

            if (fin.value && inicio.value && fin.value < inicio.value) {
                fin.value = '';
            }
        });

        // GUARDAR

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // VALIDACIONES

            if (!titulo.value.trim()) {
                titulo.focus();

                return;
            }

            if (!catedra.value) {
                catedra.focus();

                return;
            }

            if (!estado.value) {
                estado.focus();

                return;
            }

            // DATOS

            const datos = {
                titulo:
                    titulo.value.trim(),
                descripcion:
                    descripcion.value.trim(),
                // Solo fecha: la vacante abre al empezar el día de inicio
                // y cierra al terminar el día de fin
                inicio: inicio.value ? `${inicio.value} 00:00:00` : null,
                fin: fin.value ? `${fin.value} 23:59:59` : null,
                id_estado:
                    Number(estado.value),
                id_catedra:
                    Number(catedra.value),
                requisitos:
                    this.convertirRequisitos(requisitos.value)
            };

            try {
                if (esEdicion) {
                    await ApiClient.put(
                        `/vacantes/${vacante.id}`,
                        datos
                    );
                } else {
                    await ApiClient.post('/vacantes', datos);
                }

                dialog.close();

                await this.cargarVacantes();

                this.mostrarSnackbar(
                    esEdicion
                        ? 'Vacante actualizada correctamente.'
                        : 'Vacante creada correctamente.'
                );
            } catch (error) {
                console.error('Error guardando vacante:', error);

                this.mostrarSnackbar(
                    esEdicion
                        ? 'No se pudo actualizar la vacante.'
                        : 'No se pudo crear la vacante.',
                    'error'
                );
            }
        });

        // ELIMINAR DIALOG DEL DOM AL CERRAR

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();

        titulo.focus();
    }

    // 'YYYY-MM-DD' para el selector de fecha ('' si no hay fecha)
    formatearFechaInput(fecha) {
        const coincidencia = String(fecha ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
        return coincidencia ? coincidencia[1] : '';
    }

    formatearRequisitosInput(requisitos) {
        if (!requisitos) {
            return '';
        }

        // Si viene como string
        if (typeof requisitos === 'string') {
            return requisitos;
        }

        // Formato esperado:
        // {
        //     requisitos: [
        //         "...",
        //         "..."
        //     ]
        // }
        if (typeof requisitos === 'object' && Array.isArray(requisitos.requisitos)) {
            return requisitos.requisitos.join('\n');
        }

        // Compatibilidad por si ya existen datos antiguos
        if (typeof requisitos === 'object' && typeof requisitos.requisitos === 'string') {
            return requisitos.requisitos;
        }

        return '';
    }

    convertirRequisitos(valor) {
        const requisitos = valor
            .split('\n')
            .map(requisito => requisito.trim())
            .filter(requisito => requisito !== '');

        return {
            requisitos: requisitos
        };
    }

    abrirDialogoEliminar(tipo, elemento) {
        const nombres = {
            departamento: 'departamento',
            catedra: 'cátedra',
            vacante: 'vacante'
        };

        const endpoints = {
            departamento:
                `/institucional/departamentos/${elemento.id}`,
            catedra:
                `/institucional/catedras/${elemento.id}`,
            vacante:
                `/vacantes/${elemento.id}`
        };

        const nombreTipo = nombres[tipo];
        const nombreElemento = elemento.nombre || elemento.titulo || '-';
        const dialog = this.crearDialogoBase();

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>Eliminar ${nombreTipo}</h2>
            </div>

            <div class="dialog-content">
                <p>
                    ¿Desea eliminar el ${nombreTipo}
                    <strong>
                        ${this.escapeHtml(nombreElemento)}
                    </strong>?
                </p>
            </div>

            <div class="dialog-actions">
                <button type="button" class="btn btn-secondary dialog-cancel">Cancelar</button>
                <button type="button" class="btn btn-danger dialog-confirm-delete">Eliminar</button>
            </div>
        `;

        document.body.appendChild(dialog);

        const btnCancelar = dialog.querySelector('.dialog-cancel');
        const btnEliminar = dialog.querySelector('.dialog-confirm-delete');

        btnCancelar.addEventListener('click', () => dialog.close());

        btnEliminar.addEventListener('click', async () => {
            try {
                await ApiClient.delete(endpoints[tipo]);

                dialog.close();

                if (tipo === 'departamento') {
                    await this.cargarDepartamentos();
                }

                if (tipo === 'catedra') {
                    await this.cargarCatedras();
                }

                if (tipo === 'vacante') {
                    await this.cargarVacantes();
                }

                this.mostrarSnackbar(
                    `${nombreTipo.charAt(0).toUpperCase() + nombreTipo.slice(1)} eliminado correctamente.`
                );
            } catch (error) {
                console.error(
                    `Error eliminando ${tipo}:`,
                    error
                );

                this.mostrarSnackbar(
                    `No se pudo eliminar el ${nombreTipo}.`,
                    'error'
                );
            }
        });

        dialog.addEventListener('close', () => dialog.remove(), { once: true });

        dialog.showModal();
    }

    mostrarSnackbar(mensaje, tipo = 'success') {
        const anterior = document.querySelector('.app-snackbar');

        if (anterior) {
            anterior.remove();
        }

        const snackbar = document.createElement('div');

        snackbar.className =
            `app-snackbar app-snackbar-${tipo}`;

        snackbar.innerHTML = `
            <i class="bi ${
                tipo === 'success'
                    ? 'bi-check-circle-fill'
                    : 'bi-exclamation-circle-fill'
            }"></i>

            <span>${this.escapeHtml(mensaje)}</span>
        `;

        document.body.appendChild(snackbar);

        requestAnimationFrame(() => {
            snackbar.classList.add('show');
        });

        setTimeout(() => {
            snackbar.classList.remove('show');

            setTimeout(() => {
                snackbar.remove();
            }, 300);
        }, 3000);
    }
}

// REGISTRAR COMPONENTE
customElements.define('app-gestion-vacantes', GestionVacantesComponent);
