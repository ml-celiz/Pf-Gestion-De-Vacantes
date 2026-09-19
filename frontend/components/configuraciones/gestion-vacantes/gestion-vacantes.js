class GestionVacantesComponent extends HTMLElement {

    constructor() {

        super();

        // CANTIDAD POR PÁGINA
        this.vacantesPerPage = 5;
        this.catedrasPerPage = 3;
        this.departamentosPerPage = 3;

        // DATOS
        this.vacantes = [];
        this.catedras = [];
        this.departamentos = [];

        // PÁGINAS ACTUALES
        this.vacantesCurrentPage = 1;
        this.catedrasCurrentPage = 1;
        this.departamentosCurrentPage = 1;

    }

    // INICIALIZACIÓN
    async connectedCallback() {

        try {

            const response = await fetch(
                'components/configuraciones/gestion-vacantes/gestion-vacantes.html'
            );

            if (!response.ok) {

                throw new Error(
                    'Error al cargar vista de gestión de vacantes.'
                );

            }

            const html =
                await response.text();

            this.innerHTML = `
                <link
                    rel="stylesheet"
                    href="components/configuraciones/gestion-vacantes/gestion-vacantes.css">

                ${html}
            `;

            this.initEvents();

            // Cargar las tres tablas
            await Promise.all([

                this.cargarVacantes(),

                this.cargarCatedras(),

                this.cargarDepartamentos()

            ]);

        } catch (error) {

            console.error(
                'Error inicializando <app-gestion-vacantes>:',
                error
            );

        }

    }

    // EVENTOS
    initEvents() {

        // REFRESCAR
        const btnRefresh =
            this.querySelector('#btn-refresh');

        if (btnRefresh) {

            btnRefresh.addEventListener(
                'click',
                () => this.recargarTodo()
            );

        }

        // PAGINACIÓN VACANTES
        const vacantesPrev =
            this.querySelector('#vacantes-prev');

        const vacantesNext =
            this.querySelector('#vacantes-next');


        if (vacantesPrev) {

            vacantesPrev.addEventListener(
                'click',
                () => {

                    if (
                        this.vacantesCurrentPage > 1
                    ) {

                        this.vacantesCurrentPage--;

                        this.renderVacantes();

                    }

                }
            );

        }


        if (vacantesNext) {

            vacantesNext.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.ceil(
                            this.vacantes.length /
                            this.vacantesPerPage
                        );

                    if (
                        this.vacantesCurrentPage <
                        totalPages
                    ) {

                        this.vacantesCurrentPage++;

                        this.renderVacantes();

                    }

                }
            );

        }

        // PAGINACIÓN CÁTEDRAS
        const catedrasPrev =
            this.querySelector('#catedras-prev');

        const catedrasNext =
            this.querySelector('#catedras-next');


        if (catedrasPrev) {

            catedrasPrev.addEventListener(
                'click',
                () => {

                    if (
                        this.catedrasCurrentPage > 1
                    ) {

                        this.catedrasCurrentPage--;

                        this.renderCatedras();

                    }

                }
            );

        }

        if (catedrasNext) {

            catedrasNext.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.ceil(
                            this.catedras.length /
                            this.catedrasPerPage
                        );

                    if (
                        this.catedrasCurrentPage <
                        totalPages
                    ) {

                        this.catedrasCurrentPage++;

                        this.renderCatedras();

                    }

                }
            );

        }

        // PAGINACIÓN DEPARTAMENTOS
        const departamentosPrev =
            this.querySelector('#departamentos-prev');

        const departamentosNext =
            this.querySelector('#departamentos-next');


        if (departamentosPrev) {

            departamentosPrev.addEventListener(
                'click',
                () => {

                    if (
                        this.departamentosCurrentPage > 1
                    ) {

                        this.departamentosCurrentPage--;

                        this.renderDepartamentos();

                    }

                }
            );

        }

        if (departamentosNext) {

            departamentosNext.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.ceil(
                            this.departamentos.length /
                            this.departamentosPerPage
                        );

                    if (
                        this.departamentosCurrentPage <
                        totalPages
                    ) {

                        this.departamentosCurrentPage++;

                        this.renderDepartamentos();

                    }

                }
            );

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

            this.cargarDepartamentos()

        ]);

    }

    // VACANTES
    // GET /api/vacantes
    async cargarVacantes() {

        const tbody =
            this.querySelector('#tb-vacantes');


        if (!tbody) {

            console.error(
                'No se encontró #tb-vacantes'
            );

            return;

        }


        tbody.innerHTML = `
            <tr>

                <td
                    colspan="9"
                    class="text-center">

                    Cargando vacantes...

                </td>

            </tr>
        `;


        try {

            const vacantes =
                await ApiClient.get('/vacantes');


            this.vacantes =
                vacantes || [];


            this.vacantesCurrentPage = 1;


            this.renderVacantes();


        } catch (error) {

            console.error(
                'Error cargando vacantes:',
                error
            );


            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="text-center text-danger">

                        Error al cargar vacantes.

                    </td>

                </tr>
            `;

        }

    }

    // RENDER VACANTES
    renderVacantes() {

        const tbody =
            this.querySelector('#tb-vacantes');


        if (!tbody) return;


        tbody.innerHTML = '';


        if (this.vacantes.length === 0) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="text-center text-muted">

                        No hay vacantes registradas.

                    </td>

                </tr>
            `;


            this.actualizarPaginacionVacantes();

            return;

        }


        const start =
            (this.vacantesCurrentPage - 1) *
            this.vacantesPerPage;


        const end =
            start +
            this.vacantesPerPage;


        const vacantesPagina =
            this.vacantes.slice(
                start,
                end
            );


        vacantesPagina.forEach(vacante => {

            const tr =
                document.createElement('tr');


            tr.innerHTML = `
                <td>
                    ${vacante.titulo || '-'}
                </td>

                <td>
                    ${vacante.descripcion || '-'}
                </td>

                <td class="text-center">
                    <button
                        class="btn-action view"
                        title="Ver requisitos"
                        type="button">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>

                <td>
                    ${this.formatearFecha(
                        vacante.inicio
                    )}
                </td>

                <td>
                    ${this.formatearFecha(
                        vacante.fin
                    )}
                </td>

                <td>
                    ${vacante.estado || '-'}
                </td>

                <td>
                    ${vacante.catedra || '-'}
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


            tbody.appendChild(tr);

            const btnRequisitos =
                tr.querySelector('.btn-action.view');

            if (btnRequisitos) {

                btnRequisitos.addEventListener(
                    'click',
                    () => this.mostrarRequisitos(vacante.requisitos)
                );

            }

        });


        this.actualizarPaginacionVacantes();

    }

    // PAGINACIÓN VACANTES
    actualizarPaginacionVacantes() {

        const total =
            this.vacantes.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.vacantesPerPage
                )
            );


        const start =
            total === 0
                ? 0
                :
                (
                    (this.vacantesCurrentPage - 1) *
                    this.vacantesPerPage
                ) + 1;


        const end =
            Math.min(
                this.vacantesCurrentPage *
                this.vacantesPerPage,
                total
            );


        const info =
            this.querySelector(
                '#vacantes-page-info'
            );


        const pageNumber =
            this.querySelector(
                '#vacantes-page-number'
            );


        const prev =
            this.querySelector(
                '#vacantes-prev'
            );


        const next =
            this.querySelector(
                '#vacantes-next'
            );


        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }


        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.vacantesCurrentPage} de ${totalPages}`;

        }


        if (prev) {

            prev.disabled =
                this.vacantesCurrentPage <= 1;

        }


        if (next) {

            next.disabled =
                this.vacantesCurrentPage >= totalPages;

        }

    }

    // CÁTEDRAS
    // GET /api/institucional/catedras
    async cargarCatedras() {

        const tbody =
            this.querySelector('#tb-catedras');


        if (!tbody) return;


        tbody.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="text-center">

                    Cargando...

                </td>

            </tr>
        `;


        try {

            const catedras =
                await ApiClient.get(
                    '/institucional/catedras'
                );


            this.catedras =
                catedras || [];


            this.catedrasCurrentPage = 1;


            this.renderCatedras();


        } catch (error) {

            console.error(
                'Error obteniendo cátedras:',
                error
            );


            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="3"
                        class="text-center text-danger">

                        Error al obtener cátedras.

                    </td>

                </tr>
            `;

        }

    }

    // RENDER CÁTEDRAS
    renderCatedras() {

        const tbody =
            this.querySelector('#tb-catedras');


        if (!tbody) return;


        tbody.innerHTML = '';


        if (this.catedras.length === 0) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="3"
                        class="text-center text-muted">

                        No hay cátedras registradas.

                    </td>

                </tr>
            `;


            this.actualizarPaginacionCatedras();

            return;

        }


        const start =
            (this.catedrasCurrentPage - 1) *
            this.catedrasPerPage;


        const end =
            start +
            this.catedrasPerPage;


        const catedrasPagina =
            this.catedras.slice(
                start,
                end
            );


        catedrasPagina.forEach(catedra => {

            const tr =
                document.createElement('tr');


            tr.innerHTML = `
                <td>
                    ${catedra.nombre || '-'}
                </td>

                <td>
                    ${catedra.departamento || '-'}
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


            tbody.appendChild(tr);

        });


        this.actualizarPaginacionCatedras();

    }

    // PAGINACIÓN CÁTEDRAS
    actualizarPaginacionCatedras() {

        const total =
            this.catedras.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.catedrasPerPage
                )
            );


        const start =
            total === 0
                ? 0
                :
                (
                    (this.catedrasCurrentPage - 1) *
                    this.catedrasPerPage
                ) + 1;


        const end =
            Math.min(
                this.catedrasCurrentPage *
                this.catedrasPerPage,
                total
            );


        const info =
            this.querySelector(
                '#catedras-page-info'
            );


        const pageNumber =
            this.querySelector(
                '#catedras-page-number'
            );


        const prev =
            this.querySelector(
                '#catedras-prev'
            );


        const next =
            this.querySelector(
                '#catedras-next'
            );


        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }


        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.catedrasCurrentPage} de ${totalPages}`;

        }


        if (prev) {

            prev.disabled =
                this.catedrasCurrentPage <= 1;

        }


        if (next) {

            next.disabled =
                this.catedrasCurrentPage >= totalPages;

        }

    }

    // DEPARTAMENTOS
    // GET /api/institucional/departamentos
    async cargarDepartamentos() {

        const tbody =
            this.querySelector(
                '#tb-departamentos'
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

            const departamentos =
                await ApiClient.get(
                    '/institucional/departamentos'
                );


            this.departamentos =
                departamentos || [];


            this.departamentosCurrentPage = 1;


            this.renderDepartamentos();


        } catch (error) {

            console.error(
                'Error obteniendo departamentos:',
                error
            );


            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="2"
                        class="text-center text-danger">

                        Error al obtener departamentos.

                    </td>

                </tr>
            `;

        }

    }

    // RENDER DEPARTAMENTOS
    renderDepartamentos() {

        const tbody =
            this.querySelector(
                '#tb-departamentos'
            );


        if (!tbody) return;


        tbody.innerHTML = '';


        if (this.departamentos.length === 0) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="2"
                        class="text-center text-muted">

                        No hay departamentos registrados.

                    </td>

                </tr>
            `;


            this.actualizarPaginacionDepartamentos();

            return;

        }


        const start =
            (this.departamentosCurrentPage - 1) *
            this.departamentosPerPage;


        const end =
            start +
            this.departamentosPerPage;


        const departamentosPagina =
            this.departamentos.slice(
                start,
                end
            );


        departamentosPagina.forEach(departamento => {

            const tr =
                document.createElement('tr');


            tr.innerHTML = `
                <td>
                    ${departamento.nombre || '-'}
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


            tbody.appendChild(tr);

        });


        this.actualizarPaginacionDepartamentos();

    }

    // PAGINACIÓN DEPARTAMENTOS
    actualizarPaginacionDepartamentos() {

        const total =
            this.departamentos.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.departamentosPerPage
                )
            );


        const start =
            total === 0
                ? 0
                :
                (
                    (this.departamentosCurrentPage - 1) *
                    this.departamentosPerPage
                ) + 1;


        const end =
            Math.min(
                this.departamentosCurrentPage *
                this.departamentosPerPage,
                total
            );


        const info =
            this.querySelector(
                '#departamentos-page-info'
            );


        const pageNumber =
            this.querySelector(
                '#departamentos-page-number'
            );


        const prev =
            this.querySelector(
                '#departamentos-prev'
            );


        const next =
            this.querySelector(
                '#departamentos-next'
            );


        if (info) {

            info.textContent =
                `${start} - ${end} de ${total}`;

        }


        if (pageNumber) {

            pageNumber.textContent =
                `Página ${this.departamentosCurrentPage} de ${totalPages}`;

        }


        if (prev) {

            prev.disabled =
                this.departamentosCurrentPage <= 1;

        }


        if (next) {

            next.disabled =
                this.departamentosCurrentPage >= totalPages;

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

                console.error(
                    'Error interpretando requisitos:',
                    error
                );

                datos = {
                    requisitos: datos
                };

            }

        }

        const dialog =
            document.createElement('div');

        dialog.className =
            'requisitos-dialog-overlay';

        dialog.innerHTML = `

            <div
                class="requisitos-dialog"
                role="dialog"
                aria-modal="true">

                <div class="requisitos-dialog-header">

                    <h2>
                        Requisitos
                    </h2>

                    <button
                        class="btn-close-dialog"
                        type="button"
                        title="Cerrar">

                        <i class="bi bi-x-lg"></i>

                    </button>

                </div>

                <div class="requisitos-dialog-body">

                    ${this.generarRequisitosHTML(datos)}

                </div>

            </div>

        `;

        document.body.appendChild(dialog);

        const cerrar = () => {

            dialog.remove();

        };

        const btnCerrar =
            dialog.querySelector(
                '.btn-close-dialog'
            );

        const btnCerrarFooter =
            dialog.querySelector(
                '.btn-dialog-close'
            );

        btnCerrar.addEventListener(
            'click',
            cerrar
        );

        btnCerrarFooter.addEventListener(
            'click',
            cerrar
        );

        dialog.addEventListener(
            'click',
            event => {

                if (
                    event.target === dialog
                ) {

                    cerrar();

                }

            }
        );

    }

    // GENERAR HTML DE REQUISITOS
    generarRequisitosHTML(datos) {

        if (
            !datos ||
            typeof datos !== 'object'
        ) {

            return `
                <p class="requisitos-empty">
                    No hay requisitos registrados.
                </p>
            `;

        }

        return Object.entries(datos)
            .map(([clave, valor]) => {

                const titulo =
                    this.formatearTituloRequisito(
                        clave
                    );

                let contenido = '';

                if (Array.isArray(valor)) {

                    contenido = `
                        <ul class="requisitos-list">
                            ${valor.map(item => `
                                <li>
                                    ${item}
                                </li>
                            `).join('')}
                        </ul>
                    `;

                } else {

                    contenido = `
                        <p class="requisito-text">
                            ${valor || '-'}
                        </p>
                    `;

                }

                return `
                    <div class="requisito-group">

                        <h3>
                            ${titulo}
                        </h3>

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
            .replace(
                /\b\w/g,
                letra => letra.toUpperCase()
            );

    }

    // FORMATEAR FECHA
    formatearFecha(fecha) {

        if (!fecha) {
            return '-';
        }


        const date =
            new Date(fecha);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

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

}

// REGISTRAR COMPONENTE
customElements.define(
    'app-gestion-vacantes',
    GestionVacantesComponent
);