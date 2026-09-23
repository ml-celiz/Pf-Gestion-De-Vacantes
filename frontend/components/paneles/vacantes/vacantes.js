class VacantesComponent extends HTMLElement {

    constructor() {
        super();

        // CONFIGURACIÓN
        this.vacantesPerPage = 5;

        // ESTADOS DE UNA POSTULACIÓN (ids de la tabla estados)
        this.ESTADO_PENDIENTE = 4;

        // Estados que se pueden asignar al publicar un resultado
        this.ESTADOS_RESULTADO = [
            { id: 5, nombre: 'ACEPTADA' },
            { id: 6, nombre: 'CANCELADA' }
        ];

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
            // 1. Inyectar el CSS de vacantes si no está en el DOM global
            if (!document.querySelector('#vacantes-css')) {
                const link = document.createElement('link');
                link.id = 'vacantes-css';
                link.rel = 'stylesheet';
                link.href = 'components/paneles/vacantes/vacantes.css'; // Ajusta la ruta a tu archivo CSS si es diferente
                document.head.appendChild(link);
            }

            // 2. Cargar el HTML de la plantilla
            const response = await fetch('components/paneles/vacantes/vacantes.html');
            if (!response.ok) throw new Error('No se pudo cargar la plantilla HTML');
            
            this.innerHTML = await response.text();

            // 3. Inicializar eventos
            await this.inicializar();
        } catch (error) {
            console.error('Error inicializando el componente de vacantes:', error);
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
                    await ApiClient.get('/institucional/catedras');

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
                            <i class="bi bi-eye-fill"></i>
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
                        <div class="action-btn-group">

                            <!-- VER POSTULADOS -->
                            ${this.esJfc() ? `
                                <button
                                    class="btn-action postulados"
                                    type="button"
                                    title="Ver postulados"
                                    data-action="postulados">
                                    <i class="bi bi-eye-fill"></i>
                                </button>
                            ` : ''}

                            <!-- POSTULARSE (admin, pos) -->
                            ${this.puedePostularse() ? `
                                <button
                                    class="btn-action postularse"
                                    type="button"
                                    title="Postularse"
                                    data-action="postularse">
                                    <i class="bi bi-check-square-fill"></i>
                                </button>
                            ` : ''}

                            <!-- VER RESULTADOS GENERALES (admin, pos, ra) -->
                            ${this.puedeVerResultados() ? `
                                <button
                                    class="btn-action resultados"
                                    type="button"
                                    title="Ver resultados generales"
                                    data-action="resultados">
                                    <i class="bi bi-file-earmark-text-fill"></i>
                                </button>
                            ` : ''}

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
                // POSTULARSE
                // =================================================

                const btnPostularse =
                    tr.querySelector(
                        '[data-action="postularse"]'
                    );

                if (btnPostularse) {

                    btnPostularse.addEventListener(
                        'click',
                        () => {

                            this.postularse(
                                vacante,
                                btnPostularse
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

        const dialog =
            this.crearDialogoBase();

        dialog.classList.add(
            'vac-requisitos-dialog'
        );

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>
                    Requisitos de la vacante
                </h2>
            </div>

            <div class="dialog-content">
                ${this.generarHtmlRequisitos(
                    vacante.requisitos
                )}
            </div>

            <div class="dialog-actions">
                <button
                    type="button"
                    class="btn btn-secondary dialog-cancel">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(dialog);

        this.enlazarCierreDialogo(dialog);

        dialog.showModal();

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

    async verPostulados(vacante) {

        if (!vacante || !vacante.id) {

            console.error(
                'No se pudo identificar la vacante:',
                vacante
            );

            return;
        }

        // Abrir inmediatamente el diálogo
        this.mostrarDialogoPostulados(
            [],
            vacante,
            false,
            true
        );

        try {

            console.log(
                'Cargando postulados de vacante:',
                vacante.id
            );

            const solicitudes =
                await ApiClient.get(
                    `/vacantes/solicitudes?id_vacante=${encodeURIComponent(vacante.id)}`
                );

            console.log(
                'Postulados recibidos:',
                solicitudes
            );

            // Si el usuario cerró el diálogo mientras cargaba, no reabrirlo
            if (!document.querySelector('.postulados-dialog[open]')) {
                return;
            }

            // Actualizar diálogo con los datos
            this.mostrarDialogoPostulados(
                Array.isArray(solicitudes)
                    ? solicitudes
                    : [],
                vacante,
                false,
                false
            );

        } catch (error) {

            console.error(
                'Error cargando postulados:',
                error
            );

            if (!document.querySelector('.postulados-dialog[open]')) {
                return;
            }

            this.mostrarDialogoPostulados(
                [],
                vacante,
                true,
                false
            );
        }
    }

    // =========================================================
    // DIALOG: POSTULADOS
    // =========================================================

    mostrarDialogoPostulados(
        solicitudes,
        vacante,
        error = false,
        cargando = false
    ) {

        // El diálogo se crea una sola vez: los cambios de estado
        // (cargando -> datos / error) solo actualizan el contenido.
        let dialog =
            document.querySelector(
                '.postulados-dialog[open]'
            );

        const esNuevo = !dialog;

        if (esNuevo) {

            dialog =
                this.crearDialogoBase();

            dialog.classList.add(
                'postulados-dialog'
            );

        }

        // =====================================================
        // CONTENIDO
        // =====================================================

        let contenido = '';

        // -----------------------------------------------------
        // CARGANDO
        // -----------------------------------------------------

        if (cargando) {

            contenido = `
                <div class="postulados-loading">

                    <div class="spinner-border" role="status">
                    </div>

                    <span>
                        Cargando postulados...
                    </span>

                </div>
            `;

        // -----------------------------------------------------
        // ERROR
        // -----------------------------------------------------

        } else if (error) {

            contenido = `
                <div class="postulados-empty">

                    <i class="bi bi-exclamation-circle"></i>

                    <p>
                        No se pudieron cargar los postulados.
                    </p>

                </div>
            `;

        // -----------------------------------------------------
        // SIN POSTULADOS
        // -----------------------------------------------------

        } else if (!solicitudes || solicitudes.length === 0) {

            contenido = `
                <div class="postulados-empty">

                    <i class="bi bi-people"></i>

                    <p>
                        No hay postulados para esta vacante.
                    </p>

                </div>
            `;

        // -----------------------------------------------------
        // TABLA
        // -----------------------------------------------------

        } else {

            contenido = `

                <div class="postulados-table-wrapper">

                    <div class="table-responsive">

                        <table class="postulados-table custom-table">

                            <thead>

                                <tr>

                                    <th>Nombre</th>

                                    <th>Apellido</th>

                                    <th>Email</th>

                                    <th>DNI</th>

                                    <th>Teléfono</th>

                                    <th>Fecha de postulación</th>

                                    <th>Estado</th>

                                    <th class="text-center">
                                        Acciones
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                ${solicitudes.map(
                                    solicitud => {

                                        const nombre =
                                            solicitud.nombre ??
                                            solicitud.usuario_nombre ??
                                            '-';

                                        const apellido =
                                            solicitud.apellido ??
                                            solicitud.usuario_apellido ??
                                            '-';

                                        const email =
                                            solicitud.email ??
                                            solicitud.usuario_email ??
                                            '-';

                                        const dni =
                                            solicitud.dni ??
                                            solicitud.usuario_dni ??
                                            '-';

                                        const telefono =
                                            solicitud.telefono ??
                                            solicitud.usuario_telefono ??
                                            '-';

                                        return `

                                            <tr
                                                data-solicitud-id="${this.escapeHtml(
                                                    solicitud.id
                                                )}"
                                            >

                                                <td>
                                                    ${this.escapeHtml(
                                                        nombre
                                                    )}
                                                </td>

                                                <td>
                                                    ${this.escapeHtml(
                                                        apellido
                                                    )}
                                                </td>

                                                <td>
                                                    ${this.escapeHtml(
                                                        email
                                                    )}
                                                </td>

                                                <td>
                                                    ${this.escapeHtml(
                                                        dni
                                                    )}
                                                </td>

                                                <td>
                                                    ${this.escapeHtml(
                                                        telefono
                                                    )}
                                                </td>

                                                <td>
                                                    ${this.formatearFecha(
                                                        solicitud.fecha_postulacion
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        class="estado-badge"
                                                        data-estado-cell>
                                                        ${this.escapeHtml(
                                                            solicitud.estado_nombre ?? '-'
                                                        )}
                                                    </span>
                                                </td>

                                                <td class="text-center">

                                                    <div class="postulado-actions">

                                                        <!-- VER CV -->

                                                        <button
                                                            type="button"
                                                            class="btn-postulado-cv"
                                                            title="Ver CV"
                                                            data-action="ver-cv"
                                                        >

                                                            <i class="bi bi-file-earmark-person-fill"></i>

                                                        </button>


                                                        <!-- PUBLICAR RESULTADO -->

                                                        <button
                                                            type="button"
                                                            class="btn-postulado-resultado"
                                                            title="${
                                                                Number(solicitud.id_estado) === this.ESTADO_PENDIENTE
                                                                    ? 'Publicar resultado'
                                                                    : 'Resultado ya publicado'
                                                            }"
                                                            data-action="publicar-resultado"
                                                            ${
                                                                Number(solicitud.id_estado) === this.ESTADO_PENDIENTE
                                                                    ? ''
                                                                    : 'disabled'
                                                            }
                                                        >

                                                            <i class="bi bi-plus-circle-fill"></i>

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        `;

                                    }
                                ).join('')}

                            </tbody>

                        </table>
                        
                    </div>

                </div>

            `;
        }

        // =====================================================
        // HTML DEL DIALOG
        // =====================================================

        if (esNuevo) {

            dialog.innerHTML = `
                <div class="dialog-header">

                    <div>

                        <h2>
                            Postulados
                        </h2>

                        <span class="dialog-subtitle">
                            ${this.escapeHtml(
                                vacante.titulo ||
                                vacante.vacante ||
                                'Vacante'
                            )}
                        </span>

                    </div>

                </div>

                <div class="dialog-content"></div>

                <div class="dialog-actions">
                    <button
                        type="button"
                        class="btn btn-secondary dialog-cancel">
                        Cerrar
                    </button>
                </div>
            `;

            document.body.appendChild(dialog);

            this.enlazarCierreDialogo(dialog);

            dialog.showModal();

        }

        dialog.querySelector(
            '.dialog-content'
        ).innerHTML = contenido;


        // =====================================================
        // BOTÓN VER CV
        // =====================================================

        const botonesCv =
            dialog.querySelectorAll(
                '[data-action="ver-cv"]'
            );


        botonesCv.forEach(
            boton => {

                boton.addEventListener(
                    'click',
                    () => {

                        const fila =
                            boton.closest('tr');

                        const idSolicitud =
                            fila?.dataset.solicitudId;

                        console.log(
                            'Ver CV solicitud:',
                            idSolicitud
                        );

                        // Se implementará posteriormente.

                    }
                );

            }
        );


        // =====================================================
        // BOTÓN PUBLICAR RESULTADO
        // =====================================================

        const botonesResultado =
            dialog.querySelectorAll(
                '[data-action="publicar-resultado"]'
            );


        botonesResultado.forEach(
            boton => {

                boton.addEventListener(
                    'click',
                    () => {

                        const fila =
                            boton.closest('tr');

                        const idSolicitud =
                            fila?.dataset.solicitudId;

                        const solicitud =
                            solicitudes.find(
                                item =>
                                    String(item.id) ===
                                    String(idSolicitud)
                            );

                        if (solicitud) {

                            this.abrirDialogoOrdenMerito(
                                solicitud,
                                boton,
                                estado => {

                                    // Reflejar el nuevo estado en la tabla
                                    solicitud.id_estado = estado.id;
                                    solicitud.estado_nombre = estado.nombre;

                                    const celda =
                                        fila?.querySelector(
                                            '[data-estado-cell]'
                                        );

                                    if (celda) {
                                        celda.textContent = estado.nombre;
                                    }

                                }
                            );

                        }

                    }
                );

            }
        );
    }

    // =========================================================
    // CERRAR DIALOG POSTULADOS
    // =========================================================

    cerrarDialogoPostulados() {

        const dialog =
            document.querySelector(
                '.postulados-dialog'
            );

        if (dialog) {
            dialog.close();
        }
    }

    // =========================================================
    // DIALOG: ORDEN DE MÉRITO
    // POST /api/vacantes/ordenes_merito
    // =========================================================

    abrirDialogoOrdenMerito(
        solicitud,
        botonPublicar = null,
        onPublicado = null
    ) {

        const nombreCompleto =
            [
                solicitud.nombre ??
                    solicitud.usuario_nombre,

                solicitud.apellido ??
                    solicitud.usuario_apellido
            ]
                .filter(Boolean)
                .join(' ') || '-';

        const dialog =
            this.crearDialogoBase();

        dialog.classList.add(
            'orden-merito-dialog'
        );

        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>
                    Orden de mérito
                </h2>
            </div>

            <form
                id="orden-merito-form"
                class="dialog-form"
                novalidate>

                <p class="orden-merito-postulante">
                    Postulante:
                    <strong>
                        ${this.escapeHtml(nombreCompleto)}
                    </strong>
                </p>

                <div class="form-group">
                    <label for="orden-merito-puntaje">
                        Puntaje
                    </label>

                    <input
                        type="number"
                        id="orden-merito-puntaje"
                        class="form-control"
                        min="0"
                        step="1"
                        required>
                </div>

                <div class="form-group">
                    <label for="orden-merito-posicion">
                        Posición
                    </label>

                    <input
                        type="number"
                        id="orden-merito-posicion"
                        class="form-control"
                        min="1"
                        step="1"
                        required>
                </div>

                <div class="form-group">
                    <label for="orden-merito-estado">
                        Estado de la postulación
                    </label>

                    <select
                        id="orden-merito-estado"
                        class="form-control"
                        required>

                        <option value="">
                            Seleccionar...
                        </option>

                        ${this.ESTADOS_RESULTADO.map(
                            estado => `
                                <option value="${estado.id}">
                                    ${this.escapeHtml(estado.nombre)}
                                </option>
                            `
                        ).join('')}

                    </select>
                </div>

                <div class="form-group">
                    <label for="orden-merito-observaciones">
                        Observaciones
                    </label>

                    <textarea
                        id="orden-merito-observaciones"
                        class="form-control"
                        rows="4"></textarea>
                </div>

                <p
                    class="dialog-error"
                    role="alert"
                    hidden></p>

            </form>

            <div class="dialog-actions">

                <button
                    type="button"
                    class="btn btn-secondary dialog-cancel">
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="orden-merito-form"
                    class="btn btn-primary">
                    Publicar
                </button>

            </div>
        `;

        document.body.appendChild(dialog);

        const form =
            dialog.querySelector('form');

        const inputPuntaje =
            dialog.querySelector('#orden-merito-puntaje');

        const inputPosicion =
            dialog.querySelector('#orden-merito-posicion');

        const selectEstado =
            dialog.querySelector('#orden-merito-estado');

        const inputObservaciones =
            dialog.querySelector('#orden-merito-observaciones');

        const mensajeError =
            dialog.querySelector('.dialog-error');

        const btnCancelar =
            dialog.querySelector('.dialog-cancel');

        const btnPublicar =
            dialog.querySelector('.btn-primary');

        const mostrarError = mensaje => {

            mensajeError.textContent = mensaje;
            mensajeError.hidden = false;

        };

        btnCancelar.addEventListener(
            'click',
            () => dialog.close()
        );

        form.addEventListener(
            'submit',
            async event => {

                event.preventDefault();

                mensajeError.hidden = true;

                const puntaje =
                    inputPuntaje.value.trim();

                const posicion =
                    inputPosicion.value.trim();

                if (
                    !/^\d+$/.test(puntaje)
                ) {

                    mostrarError(
                        'Ingrese un puntaje válido (número entero, 0 o mayor).'
                    );

                    inputPuntaje.focus();

                    return;

                }

                if (
                    !/^\d+$/.test(posicion) ||
                    Number(posicion) < 1
                ) {

                    mostrarError(
                        'Ingrese una posición válida (número entero, 1 o mayor).'
                    );

                    inputPosicion.focus();

                    return;

                }

                const estado =
                    this.ESTADOS_RESULTADO.find(
                        item =>
                            String(item.id) ===
                            selectEstado.value
                    );

                if (!estado) {

                    mostrarError(
                        'Seleccione el estado de la postulación.'
                    );

                    selectEstado.focus();

                    return;

                }

                btnPublicar.disabled = true;
                btnCancelar.disabled = true;

                try {

                    await ApiClient.post(
                        '/vacantes/ordenes_merito',
                        {
                            id_solicitud:
                                Number(solicitud.id),

                            puntaje:
                                Number(puntaje),

                            posicion:
                                Number(posicion),

                            id_estado:
                                estado.id,

                            observaciones:
                                inputObservaciones.value.trim()
                        }
                    );

                    dialog.close();

                    // Ya tiene orden de mérito: no se puede publicar otra
                    if (
                        botonPublicar &&
                        botonPublicar.isConnected
                    ) {

                        botonPublicar.disabled = true;

                        botonPublicar.title =
                            'Resultado ya publicado';

                    }

                    if (onPublicado) {

                        onPublicado(estado);

                    }

                    this.mostrarSnackbar(
                        'Orden de mérito publicada correctamente.'
                    );

                } catch (error) {

                    console.error(
                        'Error publicando orden de mérito:',
                        error
                    );

                    mostrarError(
                        error.message ||
                        'No se pudo publicar la orden de mérito.'
                    );

                    btnPublicar.disabled = false;
                    btnCancelar.disabled = false;

                }

            }
        );

        // Si el usuario cierra con ESC o cancela, se elimina del DOM.
        // No se cierra al hacer click fuera para no perder lo cargado.
        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

        dialog.showModal();

        inputPuntaje.focus();

    }

    // =========================================================
    // SNACKBAR
    // =========================================================

    mostrarSnackbar(mensaje, tipo = 'success') {

        const anterior =
            document.querySelector('.panel-snackbar');

        if (anterior) {
            anterior.remove();
        }

        const snackbar =
            document.createElement('div');

        snackbar.className =
            `app-snackbar panel-snackbar app-snackbar-${tipo}`;

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

        document.body.appendChild(snackbar);

        // Los <dialog> modales viven en la "top layer": un popover
        // manual permite mostrar el aviso por encima de ellos.
        if (typeof snackbar.showPopover === 'function') {

            snackbar.setAttribute('popover', 'manual');

            snackbar.showPopover();

        }

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

    // =========================================================
    // ACCIÓN: POSTULARSE
    // POST /api/vacantes/solicitudes
    // El backend toma el usuario de la sesión, la fecha actual
    // y deja la solicitud en estado PENDIENTE.
    // =========================================================

    async postularse(vacante, boton) {

        if (!vacante || !vacante.id) {

            console.error(
                'No se pudo identificar la vacante:',
                vacante
            );

            return;
        }

        // Evitar postulaciones duplicadas por doble click
        if (boton) {
            boton.disabled = true;
        }

        try {

            await ApiClient.post(
                '/vacantes/solicitudes',
                {
                    id_vacante: Number(vacante.id)
                }
            );

            this.mostrarSnackbar(
                'Te postulaste correctamente a la vacante.'
            );

        } catch (error) {

            console.error(
                'Error al postularse:',
                error
            );

            this.mostrarSnackbar(
                error.message ||
                'No se pudo procesar la postulación.',
                'error'
            );

        } finally {

            if (boton) {
                boton.disabled = false;
            }

        }
    }


    // =========================================================
    // ACCIÓN: RESULTADOS GENERALES
    // GET /api/vacantes/ordenes_merito?id_vacante=
    // =========================================================

    async verResultadosGenerales(vacante) {

        if (!vacante || !vacante.id) {

            console.error(
                'No se pudo identificar la vacante:',
                vacante
            );

            return;
        }

        this.mostrarDialogoResultados(
            [],
            vacante,
            false,
            true
        );

        try {

            const ordenes =
                await ApiClient.get(
                    `/vacantes/ordenes_merito?id_vacante=${encodeURIComponent(vacante.id)}`
                );

            // Si el usuario cerró el diálogo mientras cargaba, no reabrirlo
            if (!document.querySelector('.resultados-dialog[open]')) {
                return;
            }

            this.mostrarDialogoResultados(
                Array.isArray(ordenes)
                    ? ordenes
                    : [],
                vacante,
                false,
                false
            );

        } catch (error) {

            console.error(
                'Error cargando resultados generales:',
                error
            );

            if (!document.querySelector('.resultados-dialog[open]')) {
                return;
            }

            this.mostrarDialogoResultados(
                [],
                vacante,
                true,
                false
            );
        }
    }


    // =========================================================
    // DIALOG: RESULTADOS GENERALES
    // =========================================================

    mostrarDialogoResultados(
        ordenes,
        vacante,
        error = false,
        cargando = false
    ) {

        // El diálogo se crea una sola vez: los cambios de estado
        // (cargando -> datos / error) solo actualizan el contenido.
        let dialog =
            document.querySelector(
                '.resultados-dialog[open]'
            );

        const esNuevo = !dialog;

        if (esNuevo) {

            dialog =
                this.crearDialogoBase();

            dialog.classList.add(
                'resultados-dialog'
            );

            dialog.innerHTML = `
                <div class="dialog-header">

                    <div>

                        <h2>
                            Resultados generales
                        </h2>

                        <span class="dialog-subtitle">
                            ${this.escapeHtml(
                                vacante.titulo ||
                                vacante.vacante ||
                                'Vacante'
                            )}
                        </span>

                    </div>

                </div>

                <div class="dialog-content"></div>

                <div class="dialog-actions">
                    <button
                        type="button"
                        class="btn btn-secondary dialog-cancel">
                        Cerrar
                    </button>
                </div>
            `;

            document.body.appendChild(dialog);

            this.enlazarCierreDialogo(dialog);

            dialog.showModal();

        }


        let contenido = '';

        if (cargando) {

            contenido = `
                <div class="postulados-loading">

                    <div class="spinner-border" role="status">
                    </div>

                    <span>
                        Cargando resultados...
                    </span>

                </div>
            `;

        } else if (error) {

            contenido = `
                <div class="postulados-empty">

                    <i class="bi bi-exclamation-circle"></i>

                    <p>
                        No se pudieron cargar los resultados.
                    </p>

                </div>
            `;

        } else if (!ordenes || ordenes.length === 0) {

            contenido = `
                <div class="postulados-empty">

                    <i class="bi bi-list-ol"></i>

                    <p>
                        Todavía no hay resultados publicados para esta vacante.
                    </p>

                </div>
            `;

        } else {

            contenido = `
                <div class="postulados-table-wrapper">

                    <table class="postulados-table resultados-table custom-table">

                        <thead>

                            <tr>

                                <th>DNI</th>

                                <th>Puntaje</th>

                                <th>Posición</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${ordenes.map(
                                orden => `

                                    <tr>

                                        <td>
                                            ${this.escapeHtml(
                                                orden.usuario_dni ?? '-'
                                            )}
                                        </td>

                                        <td>
                                            ${this.escapeHtml(
                                                orden.puntaje ?? '-'
                                            )}
                                        </td>

                                        <td>
                                            ${this.escapeHtml(
                                                orden.posicion ?? '-'
                                            )}
                                        </td>

                                    </tr>

                                `
                            ).join('')}

                        </tbody>

                    </table>

                </div>
            `;

        }

        dialog.querySelector(
            '.dialog-content'
        ).innerHTML = contenido;

    }


    // =========================================================
    // CERRAR DIALOG ACTUAL
    // =========================================================

    cerrarDialogoRequisitos() {

        const dialog =
            document.querySelector(
                '.vac-requisitos-dialog'
            );

        if (dialog) {

            dialog.close();

        }

    }


    // =========================================================
    // DIALOG BASE (misma interfaz que gestión de vacantes)
    // =========================================================

    crearDialogoBase() {

        const dialog =
            document.createElement('dialog');

        dialog.classList.add(
            'custom-dialog',
            'panel-dialog'
        );

        return dialog;

    }


    // Cierre por botón "Cerrar", click en el fondo y ESC (nativo).
    // Al cerrarse, el dialog se elimina del DOM.
    enlazarCierreDialogo(dialog) {

        const btnCerrar =
            dialog.querySelector(
                '.dialog-cancel'
            );

        if (btnCerrar) {

            btnCerrar.addEventListener(
                'click',
                () => dialog.close()
            );

        }

        dialog.addEventListener(
            'click',
            event => {

                if (event.target === dialog) {

                    dialog.close();

                }

            }
        );

        dialog.addEventListener(
            'close',
            () => dialog.remove(),
            { once: true }
        );

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

    // =========================================================
    // VERIFICAR ROLES
    // =========================================================

    // ¿El usuario logueado tiene alguno de los roles indicados?
    tieneRol(rolesPermitidos) {

        try {

            const usuario = AuthService.getUser();

            if (!usuario) {
                return false;
            }

            // El backend devuelve los roles como:
            // roles: [{ rol: "admin" }]

            if (!Array.isArray(usuario.roles)) {
                return false;
            }

            return usuario.roles.some(item => {

                const rol = String(item.rol ?? '')
                    .trim()
                    .toLowerCase();

                return rolesPermitidos.includes(rol);

            });

        } catch (error) {

            console.error(
                'Error obteniendo rol del usuario:',
                error
            );

            return false;
        }
    }

    // Ver postulados y publicar resultados
    esJfc() {

        return this.tieneRol(['jfc', 'admin', 'ra']);

    }

    puedePostularse() {

        return this.tieneRol(['admin', 'pos']);

    }

    puedeVerResultados() {

        return this.tieneRol(['admin', 'pos', 'ra']);

    }

}


// =============================================================
// REGISTRAR COMPONENTE
// =============================================================

customElements.define(
    'app-vacantes',
    VacantesComponent
);