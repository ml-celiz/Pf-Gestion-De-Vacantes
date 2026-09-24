/*
* SELECTOR DE FECHA
* Reemplaza al <input type="date"> nativo (cuyo calendario no se
* puede estilizar) con uno que sigue la estética de la plataforma.
*
*     <app-datepicker id="vacante-inicio" value="2026-07-23"></app-datepicker>
*
* - value: 'YYYY-MM-DD' o '' (se lee y escribe como un input).
* - min:   'YYYY-MM-DD'; los días anteriores quedan deshabilitados.
* - Dispara 'change' al elegir o limpiar una fecha.
*/
class DatePicker extends HTMLElement {
    static MESES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    static DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

    constructor() {
        super();

        this._value = '';
        this._min = '';
        this.popup = null;
        this.vista = null;   // primer día del mes que se está mostrando

        this.alPresionarFuera = this.alPresionarFuera.bind(this);
        this.alPresionarTecla = this.alPresionarTecla.bind(this);
        this.posicionar = this.posicionar.bind(this);
        this.cerrar = this.cerrar.bind(this);
    }

    connectedCallback() {
        cargarEstilos('components/datepicker/datepicker.css');

        if (this.boton) return;

        this._value = this.normalizar(this.getAttribute('value'));
        this._min = this.normalizar(this.getAttribute('min'));

        this.innerHTML = `
            <button type="button" class="datepicker-input" aria-haspopup="dialog">
                <span class="datepicker-texto"></span>
                <i class="bi bi-calendar3"></i>
            </button>
        `;

        this.boton = this.querySelector('.datepicker-input');
        this.boton.addEventListener('click', () => (this.popup ? this.cerrar() : this.abrir()));

        this.actualizarTexto();
    }

    disconnectedCallback() {
        this.cerrar();
    }

    // =========================================================
    // PROPIEDADES
    // =========================================================
    get value() {
        return this._value;
    }

    set value(valor) {
        this._value = this.normalizar(valor);
        this.actualizarTexto();
    }

    get min() {
        return this._min;
    }

    set min(valor) {
        this._min = this.normalizar(valor);
        if (this.popup) this.renderCalendario();
    }

    focus() {
        this.boton?.focus();
    }

    // =========================================================
    // CAMPO
    // =========================================================
    actualizarTexto() {
        const texto = this.querySelector('.datepicker-texto');

        if (!texto) return;

        if (this._value) {
            const [anio, mes, dia] = this._value.split('-');
            texto.textContent = `${dia}/${mes}/${anio}`;
            texto.classList.remove('vacio');
        } else {
            texto.textContent = this.getAttribute('placeholder') || 'Seleccionar fecha';
            texto.classList.add('vacio');
        }
    }

    // =========================================================
    // CALENDARIO
    // =========================================================
    abrir() {
        const base = this.aFecha(this._value) || this.aFecha(this._min) || new Date();

        this.vista = new Date(base.getFullYear(), base.getMonth(), 1);

        this.popup = document.createElement('div');
        this.popup.className = 'datepicker-popup';
        this.popup.setAttribute('role', 'dialog');
        this.popup.setAttribute('aria-label', 'Elegir fecha');

        this.popup.addEventListener('click', event => this.alHacerClick(event));

        // Dentro de un <dialog> modal el calendario tiene que vivir en el
        // mismo dialog; si no, queda detrás del fondo oscuro.
        (this.closest('dialog') || document.body).appendChild(this.popup);

        this.renderCalendario();
        this.posicionar();
        this.boton.classList.add('abierto');

        document.addEventListener('mousedown', this.alPresionarFuera, true);
        document.addEventListener('keydown', this.alPresionarTecla, true);
        window.addEventListener('scroll', this.posicionar, true);
        window.addEventListener('resize', this.posicionar);
    }

    cerrar() {
        if (!this.popup) return;

        this.popup.remove();
        this.popup = null;
        this.boton?.classList.remove('abierto');

        document.removeEventListener('mousedown', this.alPresionarFuera, true);
        document.removeEventListener('keydown', this.alPresionarTecla, true);
        window.removeEventListener('scroll', this.posicionar, true);
        window.removeEventListener('resize', this.posicionar);
    }

    renderCalendario() {
        const anio = this.vista.getFullYear();
        const mes = this.vista.getMonth();
        const hoy = this.aIso(new Date());

        // La grilla arranca el lunes de la semana del día 1
        const corrimiento = (this.vista.getDay() + 6) % 7;
        const inicio = new Date(anio, mes, 1 - corrimiento);
        let dias = '';

        for (let i = 0; i < 42; i++) {
            const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
            const iso = this.aIso(fecha);
            const clases = ['datepicker-dia'];
            if (fecha.getMonth() !== mes) clases.push('fuera');
            if (iso === hoy) clases.push('hoy');
            if (iso === this._value) clases.push('seleccionado');

            const deshabilitado = this._min && iso < this._min;

            dias += `
                <button type="button" class="${clases.join(' ')}" data-fecha="${iso}"
                    ${deshabilitado ? 'disabled' : ''}>${fecha.getDate()}</button>
            `;
        }

        this.popup.innerHTML = `
            <div class="datepicker-header">
                <button type="button" class="datepicker-nav" data-accion="anterior" aria-label="Mes anterior">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <span class="datepicker-titulo">${DatePicker.MESES[mes]} ${anio}</span>
                <button type="button" class="datepicker-nav" data-accion="siguiente" aria-label="Mes siguiente">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>

            <div class="datepicker-semana">
                ${DatePicker.DIAS.map(dia => `<span>${dia}</span>`).join('')}
            </div>

            <div class="datepicker-dias">${dias}</div>

            <div class="datepicker-footer">
                <button type="button" class="datepicker-link" data-accion="limpiar">Limpiar</button>
                <button type="button" class="datepicker-link" data-accion="hoy"
                    ${this._min && hoy < this._min ? 'disabled' : ''}>Hoy</button>
            </div>
        `;
    }

    // Debajo del campo; arriba si no entra. Siempre dentro de la ventana.
    posicionar() {
        if (!this.popup) return;

        const campo = this.boton.getBoundingClientRect();
        const alto = this.popup.offsetHeight;
        const ancho = this.popup.offsetWidth;
        const margen = 8;
        let top = campo.bottom + 6;
        if (top + alto > window.innerHeight - margen && campo.top - alto - 6 > margen) {
            top = campo.top - alto - 6;
        }

        const left = Math.min(campo.left, window.innerWidth - ancho - margen);

        this.popup.style.top = `${top}px`;
        this.popup.style.left = `${Math.max(margen, left)}px`;
    }

    // =========================================================
    // EVENTOS
    // =========================================================
    alHacerClick(event) {
        const boton = event.target.closest('button');

        if (!boton || boton.disabled) return;

        if (boton.dataset.fecha) {
            this.seleccionar(boton.dataset.fecha);
            return;
        }

        switch (boton.dataset.accion) {
            case 'anterior':
                this.vista.setMonth(this.vista.getMonth() - 1);
                this.renderCalendario();
                break;
            case 'siguiente':
                this.vista.setMonth(this.vista.getMonth() + 1);
                this.renderCalendario();
                break;
            case 'hoy':
                this.seleccionar(this.aIso(new Date()));
                break;
            case 'limpiar':
                this.seleccionar('');
                break;
        }
    }

    seleccionar(iso) {
        this.value = iso;
        this.cerrar();
        this.boton.focus();
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    alPresionarFuera(event) {
        if (!this.contains(event.target) && !this.popup?.contains(event.target)) {
            this.cerrar();
        }
    }

    // Esc cierra el calendario sin cerrar el dialog que lo contiene
    alPresionarTecla(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.cerrar();
            this.boton.focus();
        }
    }

    // =========================================================
    // UTILIDADES
    // =========================================================
    // Acepta 'YYYY-MM-DD' o una fecha con hora; devuelve 'YYYY-MM-DD' o ''
    normalizar(valor) {
        const coincidencia = String(valor ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
        return coincidencia ? coincidencia[1] : '';
    }

    aFecha(iso) {
        if (!iso) return null;
        const [anio, mes, dia] = iso.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    aIso(fecha) {
        const pad = numero => String(numero).padStart(2, '0');
        return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
    }
}

customElements.define('app-datepicker', DatePicker);
