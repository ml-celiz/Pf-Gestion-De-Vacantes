class VacantesComponent extends HTMLElement {

    constructor() {
        super();

        // CONFIGURACIÓN
        this.vacantesPerPage = 5;

        // DATOS
        this.vacantes = [];
        this.vacantesFiltradas = [];
        this.catedras = [];

        // PAGINACIÓN
        this.vacantesCurrentPage = 1;
    }

    // INICIALIZACIÓN
    async connectedCallback() {
        try {
            // 1. CARGAR HTML DEL COMPONENTE
            const response = await fetch(
                'components/paneles/vacantes/vacantes.html'
            );

            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar vacantes.html'
                );
            }

            this.innerHTML = await response.text();

            // 2. INICIALIZAR COMPONENTE
            await this.inicializar();

        } catch (error) {
            console.error(
                'Error inicializando componente Vacantes:',
                error
            );
        }
    }


    async inicializar() {
        this.configurarEventos();
        await this.cargarVacantes();
    }


    // =========================================================
    // EVENTOS
    // =========================================================

    configurarEventos() {

        // -----------------------------------------------------
        // RECARGAR
        // -----------------------------------------------------

        const btnRefresh =
            this.querySelector('#btn-refresh');

        if (btnRefresh) {

            btnRefresh.addEventListener(
                'click',
                () => {

                    this.recargar();

                }
            );

        }


        // -----------------------------------------------------
        // FILTRO
        // -----------------------------------------------------

        const filtro =
            this.querySelector('#vacantes-filter');

        if (filtro) {

            filtro.addEventListener(
                'input',
                () => {

                    this.filtrarVacantes(
                        filtro.value
                    );

                }
            );

        }


        // -----------------------------------------------------
        // PAGINACIÓN ANTERIOR
        // -----------------------------------------------------

        const prev =
            this.querySelector('#vacantes-prev');

        if (prev) {

            prev.addEventListener(
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


        // -----------------------------------------------------
        // PAGINACIÓN SIGUIENTE
        // -----------------------------------------------------

        const next =
            this.querySelector('#vacantes-next');

        if (next) {

            next.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.max(
                            1,
                            Math.ceil(
                                this.vacantesFiltradas.length /
                                this.vacantesPerPage
                            )
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

    }


    // =========================================================
    // CARGAR VACANTES
    // GET /api/vacantes
    // =========================================================

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
                    colspan="8"
                    class="text-center">

                    Cargando vacantes...

                </td>

            </tr>

        `;


        try {

            // -------------------------------------------------
            // VACANTES
            // -------------------------------------------------

            const vacantes =
                await ApiClient.get('/vacantes');

            this.vacantes =
                vacantes || [];


            // -------------------------------------------------
            // CÁTEDRAS
            // -------------------------------------------------
            // Se cargan solamente para poder mostrar el nombre
            // de la cátedra correspondiente a cada vacante.

            try {

                const catedras =
                    await ApiClient.get('/catedras');

                this.catedras =
                    catedras || [];

            } catch (error) {

                console.warn(
                    'No se pudieron cargar las cátedras:',
                    error
                );

                this.catedras = [];

            }


            // -------------------------------------------------
            // FILTRADAS
            // -------------------------------------------------

            this.vacantesFiltradas =
                [...this.vacantes];

            this.vacantesCurrentPage = 1;


            // -------------------------------------------------
            // RENDER
            // -------------------------------------------------

            this.renderVacantes();


        } catch (error) {

            console.error(
                'Error cargando vacantes:',
                error
            );

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="text-center text-danger">

                        Error al cargar las vacantes.

                    </td>

                </tr>

            `;

            this.actualizarPaginacion();

        }

    }


    // =========================================================
    // RENDER VACANTES
    // =========================================================

    renderVacantes() {

        const tbody =
            this.querySelector('#tb-vacantes');

        if (!tbody) return;


        tbody.innerHTML = '';


        // -----------------------------------------------------
        // SIN RESULTADOS
        // -----------------------------------------------------

        if (
            this.vacantesFiltradas.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="text-center text-muted">

                        No hay vacantes para mostrar.

                    </td>

                </tr>

            `;

            this.actualizarPaginacion();

            return;

        }


        // -----------------------------------------------------
        // PAGINACIÓN
        // -----------------------------------------------------

        const start =
            (
                this.vacantesCurrentPage - 1
            ) *
            this.vacantesPerPage;

        const end =
            start +
            this.vacantesPerPage;

        const vacantesPagina =
            this.vacantesFiltradas.slice(
                start,
                end
            );


        // -----------------------------------------------------
        // RENDER
        // -----------------------------------------------------

        vacantesPagina.forEach(
            vacante => {

                const tr =
                    document.createElement('tr');

                tr.dataset.id =
                    vacante.id;

                const catedra =
                    this.obtenerNombreCatedra(
                        vacante
                    );

                tr.innerHTML = `
                    <!-- VACANTE -->
                    <td>
                        ${this.escapeHtml(
                            vacante.titulo ||
                            vacante.vacante ||
                            '-'
                        )}
                    </td>

                    <!-- DESCRIPCIÓN -->
                    <td>
                        <div
                            class="descripcion-cell"
                            title="${this.escapeHtml(
                                vacante.descripcion || ''
                            )}">

                            ${this.escapeHtml(
                                vacante.descripcion ||
                                '-'
                            )}
                        </div>
                    </td>

                    <!-- REQUISITOS -->
                    <td class="text-center align-middle">
                        <button 
                            class="btn-action view"
                            title="Ver requisitos"
                            type="button"
                            data-action="requisitos">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>

                    <!-- INICIO -->
                    <td>
                        ${this.formatearFecha(
                            vacante.inicio ||
                            vacante.fecha_inicio ||
                            vacante.fechaInicio
                        )}
                    </td>

                    <!-- FIN -->
                    <td>
                        ${this.formatearFecha(
                            vacante.fin ||
                            vacante.fecha_fin ||
                            vacante.fechaFin
                        )}
                    </td>

                    <!-- ESTADO -->
                    <td>
                        <span class="estado-badge">
                            ${this.escapeHtml(
                                vacante.estado || '-'
                            )}
                        </span>
                    </td>

                    <!-- CÁTEDRA -->
                    <td>
                        ${this.escapeHtml(
                            catedra
                        )}
                    </td>

                    <!-- ACCIONES -->
                    <td class="text-center">
                        <div
                            class="action-btn-group">

                            <!-- PUBLICAR RESULTADOS -->
                            <button
                                class="btn-action publicar"
                                type="button"
                                title="Publicar resultados"
                                data-action="publicar">
                                <i class="bi bi-file-earmark-text-fill"></i>
                            </button>

                            <!-- VER POSTULADOS -->
                            <button
                                class="btn-action postulados"
                                type="button"
                                title="Ver postulados"
                                data-action="postulados">
                                <i class="bi bi-eye-fill"></i>
                            </button>

                            <!-- VER RESULTADOS GENERALES -->
                            <button
                                class="btn-action resultados"
                                type="button"
                                title="Ver resultados generales"
                                data-action="resultados">
                                <i class="bi bi-check2-square"></i>
                            </button>
                        </div>
                    </td>
                `;

                // =================================================
                // REQUISITOS
                // =================================================

                const btnRequisitos =
                    tr.querySelector(
                        '[data-action="requisitos"]'
                    );

                if (btnRequisitos) {

                    btnRequisitos.addEventListener(
                        'click',
                        () => {

                            this.mostrarRequisitos(
                                vacante
                            );

                        }
                    );

                }


                // =================================================
                // PUBLICAR RESULTADOS
                // =================================================

                const btnPublicar =
                    tr.querySelector(
                        '[data-action="publicar"]'
                    );

                if (btnPublicar) {

                    btnPublicar.addEventListener(
                        'click',
                        () => {

                            this.publicarResultados(
                                vacante
                            );

                        }
                    );

                }


                // =================================================
                // VER POSTULADOS
                // =================================================

                const btnPostulados =
                    tr.querySelector(
                        '[data-action="postulados"]'
                    );

                if (btnPostulados) {

                    btnPostulados.addEventListener(
                        'click',
                        () => {

                            this.verPostulados(
                                vacante
                            );

                        }
                    );

                }


                // =================================================
                // RESULTADOS GENERALES
                // =================================================

                const btnResultados =
                    tr.querySelector(
                        '[data-action="resultados"]'
                    );

                if (btnResultados) {

                    btnResultados.addEventListener(
                        'click',
                        () => {

                            this.verResultadosGenerales(
                                vacante
                            );

                        }
                    );

                }


                tbody.appendChild(tr);

            }
        );


        this.actualizarPaginacion();

    }


    // =========================================================
    // OBTENER CÁTEDRA
    // =========================================================

    obtenerNombreCatedra(vacante) {

        // Si el backend ya devuelve el nombre
        if (vacante.catedra_nombre) {

            return vacante.catedra_nombre;

        }

        if (vacante.catedra) {

            return typeof vacante.catedra === 'string'
                ? vacante.catedra
                : (
                    vacante.catedra.nombre ||
                    '-'
                );

        }


        // Buscar por id
        const idCatedra =
            vacante.id_catedra ??
            vacante.idCatedra;


        if (idCatedra !== undefined) {

            const catedra =
                this.catedras.find(
                    c =>
                        Number(c.id) ===
                        Number(idCatedra)
                );

            if (catedra) {

                return (
                    catedra.nombre ||
                    catedra.catedra ||
                    '-'
                );

            }

        }

        return '-';

    }


    // =========================================================
    // FILTRO
    // =========================================================

    filtrarVacantes(texto) {

        const termino =
            texto
                .trim()
                .toLowerCase();


        if (!termino) {

            this.vacantesFiltradas =
                [...this.vacantes];

        } else {

            this.vacantesFiltradas =
                this.vacantes.filter(
                    vacante => {

                        const catedra =
                            this.obtenerNombreCatedra(
                                vacante
                            );

                        const contenido = [

                            vacante.titulo,

                            vacante.descripcion,

                            vacante.estado,

                            catedra

                        ]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();


                        return contenido.includes(
                            termino
                        );

                    }
                );

        }


        this.vacantesCurrentPage = 1;

        this.renderVacantes();

    }


    // =========================================================
    // PAGINACIÓN
    // =========================================================

    actualizarPaginacion() {

        const total =
            this.vacantesFiltradas.length;


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
                : (
                    (
                        this.vacantesCurrentPage - 1
                    ) *
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


    // =========================================================
    // RECARGAR
    // =========================================================

    async recargar() {

        this.vacantesCurrentPage = 1;

        await this.cargarVacantes();

    }


    // =========================================================
    // DIALOG REQUISITOS
    // =========================================================

    mostrarRequisitos(vacante) {

        this.cerrarDialogoRequisitos();


        const overlay =
            document.createElement('div');

        overlay.className =
            'requisitos-dialog-overlay';


        const dialog =
            document.createElement('div');

        dialog.className =
            'requisitos-dialog';


        dialog.innerHTML = `

            <div
                class="requisitos-dialog-header">

                <h2>
                    Requisitos de la vacante
                </h2>

                <button
                    class="btn-close-dialog"
                    type="button"
                    title="Cerrar">

                    <i class="bi bi-x-lg"></i>

                </button>

            </div>


            <div
                class="requisitos-dialog-body">

                ${this.generarHtmlRequisitos(
                    vacante.requisitos
                )}

            </div>

        `;


        overlay.appendChild(dialog);

        document.body.appendChild(
            overlay
        );


        // -----------------------------------------------------
        // CERRAR
        // -----------------------------------------------------

        const btnCerrar =
            dialog.querySelector(
                '.btn-close-dialog'
            );

        btnCerrar.addEventListener(
            'click',
            () => {

                overlay.remove();

            }
        );


        // Cerrar haciendo click fuera
        overlay.addEventListener(
            'click',
            e => {

                if (e.target === overlay) {

                    overlay.remove();

                }

            }
        );


        // Cerrar con ESC
        const cerrarConEscape =
            e => {

                if (e.key === 'Escape') {

                    overlay.remove();

                    document.removeEventListener(
                        'keydown',
                        cerrarConEscape
                    );

                }

            };


        document.addEventListener(
            'keydown',
            cerrarConEscape
        );

    }


    // =========================================================
    // GENERAR HTML REQUISITOS
    // =========================================================

    generarHtmlRequisitos(requisitos) {

        if (!requisitos) {

            return `

                <p class="requisitos-empty">

                    No hay requisitos registrados.

                </p>

            `;

        }


        let datos = requisitos;


        // JSONB que puede llegar como string
        if (typeof datos === 'string') {

            try {

                datos = JSON.parse(datos);

            } catch (error) {

                return `

                    <p class="requisito-text">

                        ${this.escapeHtml(
                            datos
                        )}

                    </p>

                `;

            }

        }


        // Texto simple
        if (typeof datos !== 'object') {

            return `

                <p class="requisito-text">

                    ${this.escapeHtml(
                        String(datos)
                    )}

                </p>

            `;

        }


        // Array
        if (Array.isArray(datos)) {

            if (datos.length === 0) {

                return `

                    <p class="requisitos-empty">

                        No hay requisitos registrados.

                    </p>

                `;

            }

            return `

                <ul class="requisitos-list">

                    ${datos.map(
                        item => `

                            <li>
                                ${this.escapeHtml(
                                    typeof item === 'object'
                                        ? JSON.stringify(item)
                                        : String(item)
                                )}
                            </li>

                        `
                    ).join('')}

                </ul>

            `;

        }


        // Objeto
        const entries =
            Object.entries(datos);


        if (entries.length === 0) {

            return `

                <p class="requisitos-empty">

                    No hay requisitos registrados.

                </p>

            `;

        }


        return entries
            .map(
                ([clave, valor]) => {

                    return `

                        <div class="requisito-group">

                            <h3>
                                ${this.formatearClave(
                                    clave
                                )}
                            </h3>

                            ${this.generarValorRequisito(
                                valor
                            )}

                        </div>

                    `;

                }
            )
            .join('');

    }


    // =========================================================
    // VALOR DE REQUISITO
    // =========================================================

    generarValorRequisito(valor) {

        if (
            Array.isArray(valor)
        ) {

            if (valor.length === 0) {

                return `

                    <p class="requisito-text">
                        -
                    </p>

                `;

            }


            return `

                <ul class="requisitos-list">

                    ${valor.map(
                        item => `

                            <li>
                                ${this.escapeHtml(
                                    typeof item === 'object'
                                        ? JSON.stringify(item)
                                        : String(item)
                                )}
                            </li>

                        `
                    ).join('')}

                </ul>

            `;

        }


        if (
            valor !== null &&
            typeof valor === 'object'
        ) {

            return `

                <ul class="requisitos-list">

                    ${Object.entries(valor)
                        .map(
                            ([clave, dato]) => `

                                <li>

                                    <strong>
                                        ${this.formatearClave(
                                            clave
                                        )}:
                                    </strong>

                                    ${this.escapeHtml(
                                        String(dato)
                                    )}

                                </li>

                            `
                        )
                        .join('')}

                </ul>

            `;

        }


        return `

            <p class="requisito-text">

                ${this.escapeHtml(
                    valor ?? '-'
                )}

            </p>

        `;

    }


    // =========================================================
    // FORMATEAR CLAVE
    // =========================================================

    formatearClave(clave) {

        return String(clave)
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^./, letra =>
                letra.toUpperCase()
            );

    }


    // =========================================================
    // ACCIÓN: PUBLICAR RESULTADOS
    // =========================================================

    publicarResultados(vacante) {

        console.log(
            'Publicar resultados:',
            vacante
        );

        // Se implementará posteriormente.

    }


    // =========================================================
    // ACCIÓN: VER POSTULADOS
    // =========================================================

    verPostulados(vacante) {

        console.log(
            'Ver postulados:',
            vacante
        );

        // Se implementará posteriormente.

    }


    // =========================================================
    // ACCIÓN: RESULTADOS GENERALES
    // =========================================================

    verResultadosGenerales(vacante) {

        console.log(
            'Ver resultados generales:',
            vacante
        );

        // Se implementará posteriormente.

    }


    // =========================================================
    // CERRAR DIALOG ACTUAL
    // =========================================================

    cerrarDialogoRequisitos() {

        const dialog =
            document.querySelector(
                '.requisitos-dialog-overlay'
            );

        if (dialog) {

            dialog.remove();

        }

    }


    // =========================================================
    // FORMATEAR FECHA
    // =========================================================

    formatearFecha(fecha) {

        if (!fecha) {

            return '-';

        }


        const valor =
            String(fecha);


        // Si viene YYYY-MM-DD,
        // evitamos problemas de zona horaria.

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                valor
            )
        ) {

            const [
                year,
                month,
                day
            ] =
                valor.split('-');

            return `${day}/${month}/${year}`;

        }


        const date =
            new Date(fecha);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return this.escapeHtml(
                valor
            );

        }


        return date.toLocaleDateString(
            'es-AR'
        );

    }


    // =========================================================
    // ESCAPAR HTML
    // =========================================================

    escapeHtml(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {

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

customElements.define(
    'app-vacantes',
    VacantesComponent
);