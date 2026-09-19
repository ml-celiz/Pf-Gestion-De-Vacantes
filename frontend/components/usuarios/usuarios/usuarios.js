class UsuariosComponent extends HTMLElement {

    constructor() {

        super();

        // CONFIGURACIÓN
        this.usuariosPerPage = 5;

        // DATOS
        this.usuarios = [];

        // PAGINACIÓN
        this.usuariosCurrentPage = 1;

    }

    // INICIALIZACIÓN
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

            const html =
                await response.text();

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

    // EVENTOS
    initEvents() {

        // REFRESCAR
        const btnRefresh =
            this.querySelector('#btn-refresh');

        if (btnRefresh) {

            btnRefresh.addEventListener(
                'click',
                () => this.recargarUsuarios()
            );

        }

        // PAGINACIÓN ANTERIOR
        const usuariosPrev =
            this.querySelector(
                '#usuarios-prev'
            );

        if (usuariosPrev) {

            usuariosPrev.addEventListener(
                'click',
                () => {

                    if (
                        this.usuariosCurrentPage > 1
                    ) {

                        this.usuariosCurrentPage--;

                        this.renderUsuarios();

                    }

                }
            );

        }

        // PAGINACIÓN SIGUIENTE
        const usuariosNext =
            this.querySelector(
                '#usuarios-next'
            );

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

    // RECARGAR
    async recargarUsuarios() {

        this.usuariosCurrentPage = 1;
        await this.cargarUsuarios();

    }

    // GET /api/usuarios
    async cargarUsuarios() {

        const tbody =
            this.querySelector(
                '#tb-usuarios'
            );

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
                await ApiClient.get(
                    '/usuarios'
                );

            this.usuarios =
                usuarios || [];

            this.usuariosCurrentPage = 1;

            // SIN USUARIOS
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

            // RENDERIZAR-
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

    // RENDER USUARIOS
    renderUsuarios() {

        const tbody =
            this.querySelector(
                '#tb-usuarios'
            );

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
                    ${usuario.nombre || '-'}
                </td>

                <td>
                    ${usuario.apellido || '-'}
                </td>

                <td>
                    ${usuario.email || '-'}
                </td>

                <td>
                    ${usuario.rol || 'Sin rol'}
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
                    ${usuario.fecha_baja
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


        this.actualizarPaginacion();

    }

    // FORMATEAR FECHA
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

    // PAGINACIÓN
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

}

// REGISTRAR COMPONENTE
customElements.define(
    'app-usuarios',
    UsuariosComponent
);