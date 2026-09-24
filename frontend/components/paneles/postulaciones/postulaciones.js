class PostulacionesComponent extends HTMLElement {
    constructor() {
        super();

        this.postulacionesPerPage = 10;
        this.postulacionesCurrentPage = 1;
        this.postulaciones = [];
    }

    async connectedCallback() {
        try {
            // El CSS se descarga en paralelo y se espera antes de mostrar el HTML
            const estilos = cargarEstilos('components/paneles/postulaciones/postulaciones.css');
            const response = await fetch('components/paneles/postulaciones/postulaciones.html');

            if (!response.ok) {
                throw new Error('No se pudo cargar postulaciones.html');
            }

            await estilos;

            this.innerHTML = await response.text();

            this.configurarEventos();
            await this.cargarPostulaciones();
        } catch (error) {
            console.error('Error al cargar el componente de postulaciones:', error);

            this.innerHTML = `
                <div class="alert alert-danger m-3">
                    No se pudo cargar el panel de postulaciones.
                </div>
            `;
        }
    }

    /* =====================================================
       EVENTOS
       ===================================================== */

    configurarEventos() {
        this.querySelector('#btn-refresh-postulaciones')
            .addEventListener('click', () => this.cargarPostulaciones());

        this.querySelector('#postulaciones-prev').addEventListener('click', () => {
            if (this.postulacionesCurrentPage > 1) {
                this.postulacionesCurrentPage--;
                this.renderPostulaciones();
            }
        });

        this.querySelector('#postulaciones-next').addEventListener('click', () => {
            if (this.postulacionesCurrentPage < this.totalPaginas()) {
                this.postulacionesCurrentPage++;
                this.renderPostulaciones();
            }
        });
    }

    /* =====================================================
       CARGAR POSTULACIONES
       GET /api/vacantes/solicitudes
       El backend ya limita la lista: un postulante solo recibe
       las suyas (sin las dadas de baja); admin y ra ven todas.
       ===================================================== */

    async cargarPostulaciones() {
        const usuario = AuthService.getUser();
        const roles = AuthService.getRoles();
        const veTodas = roles.includes('admin') || roles.includes('ra');

        const endpoint = veTodas
            ? '/vacantes/solicitudes'
            : `/vacantes/solicitudes?id_usuario=${usuario?.id}`;

        try {
            const respuesta = await ApiClient.get(endpoint);
            this.postulaciones = Array.isArray(respuesta) ? respuesta : [];
        } catch (error) {
            console.error('Error al cargar las postulaciones:', error);
            this.postulaciones = [];
        }

        this.postulacionesCurrentPage = 1;
        this.renderPostulaciones();
    }

    /* =====================================================
       RENDER
       ===================================================== */

    renderPostulaciones() {
        const tbody = this.querySelector('#tb-postulaciones');

        if (!tbody) return;

        if (this.postulaciones.length === 0) {
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

        const inicio = (this.postulacionesCurrentPage - 1) * this.postulacionesPerPage;
        const pagina = this.postulaciones.slice(inicio, inicio + this.postulacionesPerPage);

        tbody.innerHTML = '';

        pagina.forEach(postulacion => {
            // Tiene resultado publicado (orden de mérito)
            const evaluada = Boolean(postulacion.orden_merito);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${this.escapeHtml(postulacion.vacante_titulo || 'Sin título')}</td>
                <td>${this.formatearFecha(postulacion.fecha_postulacion)}</td>
                <td>
                    <span class="estado-badge">
                        ${this.escapeHtml(postulacion.estado_nombre || 'Sin estado')}
                    </span>
                </td>
                <td>
                    <div class="action-btn-group">
                        <!-- Ver resultado: solo si hay orden de mérito -->
                        <button
                            class="btn-action view"
                            type="button"
                            title="${evaluada
                                ? 'Ver resultado de la postulación'
                                : 'El resultado todavía no fue publicado'}"
                            ${evaluada ? '' : 'disabled'}>
                            <i class="bi bi-eye-fill"></i>
                        </button>

                        <!-- Dar de baja: solo mientras no fue evaluada -->
                        <button
                            class="btn-action delete"
                            type="button"
                            title="${evaluada
                                ? 'La postulación ya fue evaluada'
                                : 'Dar de baja la postulación'}"
                            ${evaluada ? 'disabled' : ''}>
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tr.querySelector('.btn-action.view')
                .addEventListener('click', () => this.mostrarResultado(postulacion));

            tr.querySelector('.btn-action.delete')
                .addEventListener('click', () => this.confirmarBaja(postulacion));

            tbody.appendChild(tr);
        });

        this.actualizarPaginacion();
    }

    /* =====================================================
       PAGINACIÓN
       ===================================================== */

    totalPaginas() {
        return Math.max(1, Math.ceil(this.postulaciones.length / this.postulacionesPerPage));
    }

    actualizarPaginacion() {
        const totalPaginas = this.totalPaginas();

        this.querySelector('#postulaciones-page-info').textContent =
            `${this.postulaciones.length} postulaciones`;

        this.querySelector('#postulaciones-page-number').textContent =
            `${this.postulacionesCurrentPage} / ${totalPaginas}`;

        this.querySelector('#postulaciones-prev').disabled = this.postulacionesCurrentPage <= 1;
        this.querySelector('#postulaciones-next').disabled =
            this.postulacionesCurrentPage >= totalPaginas;
    }

    /* =====================================================
       VER RESULTADO
       Muestra la orden de mérito publicada para la
       postulación. Solo se llega si ya existe.
       ===================================================== */

    mostrarResultado(postulacion) {
        const orden = postulacion.orden_merito;

        if (!orden) return;

        const observaciones = (orden.observaciones || '').trim();
        const posicion = orden.posicion != null ? `${this.escapeHtml(orden.posicion)}°` : '-';
        const dialog = this.crearDialogo('postulacion-resultado-dialog');

        dialog.innerHTML = `
            <div class="app-dialog-header">
                <h2>Resultado de la postulación</h2>

                <button type="button" class="app-dialog-close" title="Cerrar" aria-label="Cerrar">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="app-dialog-body">
                <div class="resultado-vacante">
                    <span class="resultado-label">Vacante</span>
                    <p class="resultado-vacante-titulo">
                        ${this.escapeHtml(postulacion.vacante_titulo || 'Sin título')}
                    </p>
                    <span class="resultado-estado">
                        ${this.escapeHtml(postulacion.estado_nombre || 'Sin estado')}
                    </span>
                </div>

                <div class="resultado-metricas">
                    <div class="resultado-metrica">
                        <span class="resultado-label">Posición</span>
                        <span class="resultado-metrica-valor">${posicion}</span>
                    </div>

                    <div class="resultado-metrica">
                        <span class="resultado-label">Puntaje</span>
                        <span class="resultado-metrica-valor">
                            ${this.escapeHtml(orden.puntaje ?? '-')}
                        </span>
                    </div>
                </div>

                <div class="resultado-bloque">
                    <span class="resultado-label">Observaciones</span>
                    <p class="resultado-observaciones ${observaciones ? '' : 'resultado-vacio'}">${
                        observaciones ? this.escapeHtml(observaciones) : 'Sin observaciones.'
                    }</p>
                </div>

                <div class="resultado-fecha">
                    <i class="bi bi-calendar-check"></i>
                    <span>
                        Publicado el
                        <strong>${this.formatearFechaHora(orden.fecha_publicacion)}</strong>
                    </span>
                </div>
            </div>

            <div class="app-dialog-actions">
                <button type="button" class="app-btn app-btn-primary dialog-cerrar">Cerrar</button>
            </div>
        `;

        dialog.querySelectorAll('.app-dialog-close, .dialog-cerrar').forEach(boton => {
            boton.addEventListener('click', () => dialog.close());
        });

        dialog.showModal();
    }

    /* =====================================================
       DAR DE BAJA
       DELETE /api/vacantes/solicitudes/{id}
       Baja lógica: el backend completa la fecha de baja y la
       postulación deja de listarse.
       ===================================================== */

    confirmarBaja(postulacion) {
        const dialog = this.crearDialogo('postulacion-baja-dialog');

        dialog.innerHTML = `
            <div class="app-dialog-header">
                <h2>Dar de baja la postulación</h2>
            </div>

            <div class="app-dialog-body">
                <p>
                    ¿Seguro que querés dar de baja tu postulación a
                    <strong>${this.escapeHtml(postulacion.vacante_titulo || 'esta vacante')}</strong>?
                </p>
                <p>Mientras la convocatoria siga abierta vas a poder volver a postularte.</p>
                <p class="app-dialog-error" role="alert" hidden></p>
            </div>

            <div class="app-dialog-actions">
                <button type="button" class="app-btn app-btn-secondary dialog-cancelar">
                    Cancelar
                </button>
                <button type="button" class="app-btn app-btn-danger dialog-confirmar">
                    <i class="bi bi-trash-fill"></i>
                    Dar de baja
                </button>
            </div>
        `;

        const btnCancelar = dialog.querySelector('.dialog-cancelar');
        const btnConfirmar = dialog.querySelector('.dialog-confirmar');
        const mensajeError = dialog.querySelector('.app-dialog-error');

        btnCancelar.addEventListener('click', () => dialog.close());

        btnConfirmar.addEventListener('click', async () => {
            mensajeError.hidden = true;
            btnConfirmar.disabled = true;
            btnCancelar.disabled = true;

            try {
                await ApiClient.delete(`/vacantes/solicitudes/${postulacion.id}`);

                dialog.close();
                await this.cargarPostulaciones();
                this.mostrarSnackbar('La postulación se dio de baja correctamente.');
            } catch (error) {
                console.error('Error al dar de baja la postulación:', error);

                mensajeError.textContent = error.message || 'No se pudo dar de baja la postulación.';
                mensajeError.hidden = false;
                btnConfirmar.disabled = false;
                btnCancelar.disabled = false;
            }
        });

        dialog.showModal();
    }

    /* =====================================================
       DIALOG BASE
       Usa el estilo común de global.css (.app-dialog).
       Se elimina del DOM al cerrarse (botones o Esc).
       ===================================================== */

    crearDialogo(claseExtra) {
        const dialog = document.createElement('dialog');

        dialog.className = `app-dialog ${claseExtra}`;
        dialog.addEventListener('close', () => dialog.remove(), { once: true });
        document.body.appendChild(dialog);

        return dialog;
    }

    /* =====================================================
       SNACKBAR
       ===================================================== */

    mostrarSnackbar(mensaje, tipo = 'success') {
        document.querySelector('.postulaciones-snackbar')?.remove();

        const icono = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
        const snackbar = document.createElement('div');

        snackbar.className = `app-snackbar postulaciones-snackbar app-snackbar-${tipo}`;
        snackbar.innerHTML = `
            <i class="bi ${icono}"></i>
            <span>${this.escapeHtml(mensaje)}</span>
        `;

        document.body.appendChild(snackbar);
        requestAnimationFrame(() => snackbar.classList.add('show'));

        setTimeout(() => {
            snackbar.classList.remove('show');
            setTimeout(() => snackbar.remove(), 300);
        }, 3000);
    }

    /* =====================================================
       FECHAS
       ===================================================== */

    formatearFecha(fecha) {
        if (!fecha) return '-';

        // Fecha sola (YYYY-MM-DD): new Date() la tomaría como UTC y en
        // Argentina mostraría el día anterior
        const soloFecha = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (soloFecha) {
            return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) return this.escapeHtml(fecha);

        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Recibe un instante ISO ('2026-07-23T21:20:49Z') y lo muestra
    // en la hora local: '23/07/2026 18:20:49 hs'
    formatearFechaHora(fecha) {
        if (!fecha) return '-';

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) return this.escapeHtml(fecha);

        const dia = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const hora = date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        return `${dia} ${hora} hs`;
    }

    escapeHtml(valor) {
        const div = document.createElement('div');
        div.textContent = valor ?? '';
        return div.innerHTML;
    }
}

customElements.define('app-postulaciones', PostulacionesComponent);
