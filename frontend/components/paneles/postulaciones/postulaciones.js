class PostulacionesComponent extends HTMLElement {

    constructor() {

        super();

        // CANTIDAD POR PÁGINA
        this.postulacionesPerPage = 5;

        // DATOS
        this.postulaciones = [];
        this.postulacionesFiltradas = [];

        // PAGINACIÓN
        this.postulacionesCurrentPage = 1;
    }


    async connectedCallback() {

        try {

            const response =
                await fetch(
                    'components/paneles/postulaciones/postulaciones.html'
                );

            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar postulaciones.html'
                );
            }

            this.innerHTML =
                await response.text();

            await this.inicializar();

        } catch (error) {

            console.error(
                'Error al cargar el componente de postulaciones:',
                error
            );

            this.innerHTML = `
                <div class="alert alert-danger m-3">
                    No se pudo cargar el panel de postulaciones.
                </div>
            `;
        }
    }


    async inicializar() {

        this.configurarEventos();
        await this.cargarPostulaciones();
    }


    /* =====================================================
       EVENTOS
       ===================================================== */

    configurarEventos() {

        // ACTUALIZAR
        const btnRefresh =
            this.querySelector(
                '#btn-refresh-postulaciones'
            );

        if (btnRefresh) {

            btnRefresh.addEventListener(
                'click',
                () => this.cargarPostulaciones()
            );
        }


        // FILTRO
        const inputFiltro =
            this.querySelector(
                '#postulaciones-filter'
            );

        if (inputFiltro) {

            inputFiltro.addEventListener(
                'input',
                () => this.filtrarPostulaciones(
                    inputFiltro.value
                )
            );
        }


        // PAGINACIÓN ANTERIOR
        const btnPrev =
            this.querySelector(
                '#postulaciones-prev'
            );

        if (btnPrev) {

            btnPrev.addEventListener(
                'click',
                () => {

                    if (
                        this.postulacionesCurrentPage > 1
                    ) {

                        this.postulacionesCurrentPage--;

                        this.renderPostulaciones();
                    }
                }
            );
        }


        // PAGINACIÓN SIGUIENTE
        const btnNext =
            this.querySelector(
                '#postulaciones-next'
            );

        if (btnNext) {

            btnNext.addEventListener(
                'click',
                () => {

                    const totalPages =
                        Math.ceil(
                            this.postulacionesFiltradas.length /
                            this.postulacionesPerPage
                        );

                    if (
                        this.postulacionesCurrentPage <
                        totalPages
                    ) {

                        this.postulacionesCurrentPage++;

                        this.renderPostulaciones();
                    }
                }
            );
        }
    }


    /* =====================================================
       CARGAR POSTULACIONES
       ===================================================== */

    async cargarPostulaciones() {
        try {
            const usuario = AuthService.getUser();

            if (!usuario) {
                console.error('No se pudo obtener el usuario logueado.');
                this.postulaciones = [];
                this.postulacionesFiltradas = [];
                this.renderPostulaciones();
                return;
            }

            // Verificamos si tiene roles 'admin' o 'ra'
            const roles = Array.isArray(usuario.roles) 
                ? usuario.roles.map(r => (typeof r === 'object' ? r.rol : r).toLowerCase()) 
                : [];

            const esAdminORa = roles.includes('admin') || roles.includes('ra');

            // Si es admin o ra trae todas las solicitudes; de lo contrario filtra por usuario
            const endpoint = esAdminORa 
                ? '/vacantes/solicitudes' 
                : `/vacantes/solicitudes?id_usuario=${usuario.id}`;

            console.log(`Cargando postulaciones con endpoint: ${endpoint}`);

            const response = await ApiClient.get(endpoint);

            // Validamos la respuesta por si viene directa [ ] o envuelta en un objeto { solicitudes: [ ] }
            if (Array.isArray(response)) {
                this.postulaciones = response;
            } else if (response && Array.isArray(response.solicitudes_vacantes)) {
                this.postulaciones = response.solicitudes_vacantes;
            } else if (response && Array.isArray(response.data)) {
                this.postulaciones = response.data;
            } else {
                this.postulaciones = [];
            }

            this.postulacionesFiltradas = [...this.postulaciones];
            this.postulacionesCurrentPage = 1;

            this.renderPostulaciones();

        } catch (error) {
            console.error('Error al cargar las postulaciones:', error);
            this.postulaciones = [];
            this.postulacionesFiltradas = [];
            this.renderPostulaciones();
        }
    }


    /* =====================================================
       RENDER
       ===================================================== */

    renderPostulaciones() {

        const tbody = this.querySelector('#tb-postulaciones');

            if (!tbody) return;

            if (this.postulacionesFiltradas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted py-4">
                            No se encontraron postulaciones.
                        </td>
                    </tr>
                `;
                this.actualizarPaginacion();
                return;
            }

        const inicio =
            (
                this.postulacionesCurrentPage - 1
            ) *
            this.postulacionesPerPage;


        const fin =
            inicio +
            this.postulacionesPerPage;


        const postulacionesPagina =
            this.postulacionesFiltradas.slice(
                inicio,
                fin
            );


        tbody.innerHTML = '';


        postulacionesPagina.forEach(
            postulacion => {

                const tr =
                    document.createElement('tr');


                tr.innerHTML = `

                    <!-- VACANTE -->

                    <td class="vacante-cell">

                        ${this.escapeHtml(
                            postulacion.vacante_titulo ||
                            'Sin título'
                        )}

                    </td>


                    <!-- FECHA -->

                    <td class="fecha-cell">

                        ${this.formatearFecha(
                            postulacion.fecha_postulacion
                        )}

                    </td>


                    <!-- ESTADO -->

                    <td>

                        <span
                            class="estado-badge">

                            ${this.escapeHtml(
                                postulacion.estado_nombre ||
                                'Sin estado'
                            )}

                        </span>

                    </td>


                    <!-- ACCIONES -->

                    <td>

                        <div class="action-btn-group">

                            <!-- VER -->

                            <button
                                class="btn-action view"
                                title="Ver postulación"
                                type="button">

                                <i class="bi bi-eye-fill"></i>

                            </button>


                            <!-- EDITAR -->

                            <button
                                class="btn-action edit"
                                title="Editar postulación"
                                type="button">

                                <i class="bi bi-pencil-fill"></i>

                            </button>


                            <!-- DAR DE BAJA -->

                            <button
                                class="btn-action delete"
                                title="Dar de baja postulación"
                                type="button">

                                <i class="bi bi-trash-fill"></i>

                            </button>

                        </div>

                    </td>
                `;


                /* =============================
                   VER
                   ============================= */

                const btnVer =
                    tr.querySelector(
                        '.btn-action.view'
                    );

                if (btnVer) {

                    btnVer.addEventListener(
                        'click',
                        () =>
                            this.mostrarPostulacion(
                                postulacion
                            )
                    );
                }


                /* =============================
                   EDITAR
                   ============================= */

                const btnEditar =
                    tr.querySelector(
                        '.btn-action.edit'
                    );

                if (btnEditar) {

                    btnEditar.addEventListener(
                        'click',
                        () =>
                            this.editarPostulacion(
                                postulacion
                            )
                    );
                }


                /* =============================
                   DAR DE BAJA
                   ============================= */

                const btnEliminar =
                    tr.querySelector(
                        '.btn-action.delete'
                    );

                if (btnEliminar) {

                    btnEliminar.addEventListener(
                        'click',
                        () =>
                            this.eliminarPostulacion(
                                postulacion
                            )
                    );
                }


                tbody.appendChild(tr);
            }
        );


        this.actualizarPaginacion();
    }


    /* =====================================================
       FILTRO
       ===================================================== */

    filtrarPostulaciones(texto) {

        const termino =
            texto
                .trim()
                .toLowerCase();


        this.postulacionesFiltradas =
            this.postulaciones.filter(
                postulacion => {

                    const vacante =
                        (
                            postulacion.vacante_titulo ||
                            ''
                        ).toLowerCase();


                    const estado =
                        (
                            postulacion.estado_nombre ||
                            ''
                        ).toLowerCase();


                    return (
                        vacante.includes(termino) ||
                        estado.includes(termino)
                    );
                }
            );


        this.postulacionesCurrentPage = 1;

        this.renderPostulaciones();
    }


    /* =====================================================
       PAGINACIÓN
       ===================================================== */

    actualizarPaginacion() {

        const total =
            this.postulacionesFiltradas.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    this.postulacionesPerPage
                )
            );


        const pageInfo =
            this.querySelector(
                '#postulaciones-page-info'
            );

        if (pageInfo) {

            pageInfo.textContent =
                `${total} postulaciones`;
        }


        const pageNumber =
            this.querySelector(
                '#postulaciones-page-number'
            );

        if (pageNumber) {

            pageNumber.textContent =
                `${this.postulacionesCurrentPage} / ${totalPages}`;
        }


        const btnPrev =
            this.querySelector(
                '#postulaciones-prev'
            );

        if (btnPrev) {

            btnPrev.disabled =
                this.postulacionesCurrentPage <= 1;
        }


        const btnNext =
            this.querySelector(
                '#postulaciones-next'
            );

        if (btnNext) {

            btnNext.disabled =
                this.postulacionesCurrentPage >=
                totalPages;
        }
    }


    /* =====================================================
       VER POSTULACIÓN
       ===================================================== */

    mostrarPostulacion(postulacion) {

        this.cerrarDialogo();


        const overlay =
            document.createElement('div');

        overlay.className =
            'postulacion-dialog-overlay';


        const dialog =
            document.createElement('div');

        dialog.className =
            'postulacion-dialog';


        dialog.innerHTML = `

            <div class="postulacion-dialog-header">

                <h2>
                    Postulación
                </h2>

                <button
                    class="btn-close-dialog"
                    type="button"
                    title="Cerrar">

                    <i class="bi bi-x-lg"></i>

                </button>

            </div>


            <div class="postulacion-dialog-body">

                <div class="postulacion-detail">

                    <span class="postulacion-detail-label">
                        Vacante
                    </span>

                    <p class="postulacion-detail-value">
                        ${this.escapeHtml(
                            postulacion.vacante_titulo ||
                            'Sin título'
                        )}
                    </p>

                </div>


                <div class="postulacion-detail">

                    <span class="postulacion-detail-label">
                        Fecha de postulación
                    </span>

                    <p class="postulacion-detail-value">
                        ${this.formatearFecha(
                            postulacion.fecha_postulacion
                        )}
                    </p>

                </div>


                <div class="postulacion-detail">

                    <span class="postulacion-detail-label">
                        Estado
                    </span>

                    <p class="postulacion-detail-value">
                        ${this.escapeHtml(
                            postulacion.estado_nombre ||
                            'Sin estado'
                        )}
                    </p>

                </div>


                <div class="postulacion-detail">

                    <span class="postulacion-detail-label">
                        CV
                    </span>

                    <p class="postulacion-detail-value">
                        ${this.escapeHtml(
                            postulacion.cv ||
                            'No especificado'
                        )}
                    </p>

                </div>

            </div>
        `;


        overlay.appendChild(dialog);

        document.body.appendChild(overlay);


        const btnCerrar =
            dialog.querySelector(
                '.btn-close-dialog'
            );

        if (btnCerrar) {

            btnCerrar.addEventListener(
                'click',
                () => this.cerrarDialogo()
            );
        }


        overlay.addEventListener(
            'click',
            event => {

                if (event.target === overlay) {

                    this.cerrarDialogo();
                }
            }
        );


        this._dialogEscapeHandler =
            event => {

                if (event.key === 'Escape') {

                    this.cerrarDialogo();
                }
            };


        document.addEventListener(
            'keydown',
            this._dialogEscapeHandler
        );
    }


    /* =====================================================
       EDITAR
       ===================================================== */

    editarPostulacion(postulacion) {

        console.log(
            'Editar postulación:',
            postulacion
        );

        /*
         * Actualmente el backend solamente permite
         * modificar el estado mediante PUT.
         *
         * Cuando definamos qué campos puede editar
         * el usuario, acá podemos abrir el formulario
         * correspondiente.
         */
    }


    /* =====================================================
       ELIMINAR / DAR DE BAJA
       ===================================================== */

    async eliminarPostulacion(postulacion) {

        const confirmar =
            confirm(
                `¿Desea dar de baja su postulación a "${postulacion.vacante_titulo}"?`
            );


        if (!confirmar) return;


        try {

            await ApiClient.delete(
                `/vacantes/solicitudes/${postulacion.id}`
            );


            await this.cargarPostulaciones();


        } catch (error) {

            console.error(
                'Error al dar de baja la postulación:',
                error
            );
        }
    }


    /* =====================================================
       CERRAR DIÁLOGO
       ===================================================== */

    cerrarDialogo() {

        const overlay =
            document.querySelector(
                '.postulacion-dialog-overlay'
            );

        if (overlay) {

            overlay.remove();
        }


        if (this._dialogEscapeHandler) {

            document.removeEventListener(
                'keydown',
                this._dialogEscapeHandler
            );

            this._dialogEscapeHandler = null;
        }
    }


    /* =====================================================
       FECHA
       ===================================================== */

    formatearFecha(fecha) {

        if (!fecha) {
            return '-';
        }


        const date =
            new Date(fecha);


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


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    escapeHtml(valor) {

        const div =
            document.createElement('div');

        div.textContent =
            valor ?? '';

        return div.innerHTML;
    }
}


customElements.define(
    'app-postulaciones',
    PostulacionesComponent
);