/*
* VALIDACIONES DE FORMULARIOS
* Cada función devuelve el mensaje de error a mostrar, o null si el valor
* es válido. Son las mismas reglas que aplica el backend
* (backend/utils/validaciones.php): acá se validan para avisar al usuario
* antes de enviar, y el backend las vuelve a controlar.
*/
const Validaciones = {
    // Texto de ayuda que se muestra debajo de los campos de contraseña nueva
    AYUDA_CONTRASENA:
        'Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial.',

    // 8 a 72 caracteres, con mayúscula, minúscula, número y carácter especial
    contrasena(valor) {
        if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (valor.length > 72) return 'La contraseña puede tener como máximo 72 caracteres.';
        if (!/[A-ZÁÉÍÓÚÑ]/.test(valor)) return 'La contraseña debe tener al menos una letra mayúscula.';
        if (!/[a-záéíóúñ]/.test(valor)) return 'La contraseña debe tener al menos una letra minúscula.';
        if (!/\d/.test(valor)) return 'La contraseña debe tener al menos un número.';
        if (!/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(valor)) {
            return 'La contraseña debe tener al menos un carácter especial (por ejemplo: ! @ # $ % & *).';
        }
        return null;
    },

    // Obligatorio, con formato válido y hasta 50 caracteres
    email(valor) {
        const email = valor.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresá un correo electrónico válido.';
        if (email.length > 50) return 'El correo electrónico puede tener como máximo 50 caracteres.';
        return null;
    },

    // Nombre o apellido: obligatorio, hasta 50 caracteres, solo letras
    nombre(valor, campo = 'nombre') {
        const texto = valor.trim();

        if (!texto) return `El ${campo} es obligatorio.`;
        if (texto.length > 50) return `El ${campo} puede tener como máximo 50 caracteres.`;
        if (!/^[\p{L}\s'-]+$/u.test(texto)) return `El ${campo} solo puede contener letras.`;
        return null;
    },

    // 7 u 8 dígitos. Vacío es válido salvo que sea obligatorio
    dni(valor, obligatorio = false) {
        const dni = String(valor ?? '').trim();

        if (!dni) return obligatorio ? 'El DNI es obligatorio.' : null;
        if (!/^\d{7,8}$/.test(dni)) return 'El DNI debe tener 7 u 8 números, sin puntos.';
        return null;
    },

    // Opcional: 6 a 20 caracteres entre números, espacios, +, - y paréntesis
    telefono(valor) {
        const telefono = String(valor ?? '').trim();

        if (!telefono) return null;
        if (!/^[\d\s()+-]{6,20}$/.test(telefono)) {
            return 'El teléfono solo puede contener números, espacios, +, - y paréntesis (6 a 20 caracteres).';
        }
        return null;
    },

    // Texto obligatorio (nombre de rol, módulo, panel, departamento, cátedra...)
    textoObligatorio(valor, campo, maximo = 50) {
        const texto = String(valor ?? '').trim();

        if (!texto) return `El campo ${campo} es obligatorio.`;
        if (texto.length > maximo) return `El campo ${campo} puede tener como máximo ${maximo} caracteres.`;
        return null;
    }
};

/*
* BOTÓN "OJO" PARA VER LA CONTRASEÑA
* Agrega a cada <input type="password"> dentro de `raiz` un botón que
* alterna entre mostrar y ocultar lo escrito. Se llama después de
* insertar el HTML del formulario (login, perfil, usuarios).
*/
function agregarOjosContrasena(raiz) {
    raiz.querySelectorAll('input[type="password"]:not([data-con-ojo])').forEach(input => {
        input.dataset.conOjo = 'true';

        // Contenedor para ubicar el botón dentro del campo, a la derecha
        const contenedor = document.createElement('div');
        contenedor.className = 'campo-contrasena';
        input.parentNode.insertBefore(contenedor, input);
        contenedor.appendChild(input);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-ver-contrasena';
        boton.setAttribute('aria-label', 'Mostrar contraseña');
        boton.setAttribute('aria-pressed', 'false');
        boton.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i>';
        contenedor.appendChild(boton);

        boton.addEventListener('click', () => {
            const mostrar = input.type === 'password';

            input.type = mostrar ? 'text' : 'password';
            boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
            boton.setAttribute('aria-pressed', String(mostrar));
            boton.innerHTML = `<i class="bi ${mostrar ? 'bi-eye-slash' : 'bi-eye'}" aria-hidden="true"></i>`;
            input.focus();
        });
    });
}
