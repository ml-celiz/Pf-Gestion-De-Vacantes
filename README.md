# Sistema de Gestión de Vacantes - UTN FRRO

Sistema web para publicar vacantes docentes de la UTN Facultad Regional Rosario, recibir postulaciones de los interesados (con su CV) y publicar las órdenes de mérito. Cuando un postulante es aceptado se le notifica por correo electrónico.

**URL de producción:** https://gestion-vacantes-frro.alwaysdata.net

**Repositorio:** https://github.com/ml-celiz/Pf-Gestion-De-Vacantes

## Integrantes

- Maria Luz Celiz - Legajo: 44772

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Web Components), Bootstrap 5 y Bootstrap Icons.
- **Backend:** PHP 8 (API REST, sin frameworks).
- **Base de datos:** PostgreSQL.
- **Correo:** SMTP (Gmail).
- **Hosting:** alwaysdata (Apache, PHP 8 y PostgreSQL), con HTTPS.

## Roles y usuarios de prueba

| Rol | Qué puede hacer | Usuario | Contraseña |
|---|---|---|---|
| Invitado (INV) | Solo ver las vacantes abiertas, sin iniciar sesión. | Botón **"Acceder como invitado"** del login | — |
| Postulante (POS) | Postularse a vacantes, cargar su CV y seguir sus postulaciones. | pos@gmail.com | 123 |
| Responsable Administrativo (RA) | Administrar vacantes, cátedras y departamentos; ver postulados y sus CV. | ra@gmail.com | 123 |
| Jefe de cátedra (JFC) | Ver los postulados de sus cátedras, descargar sus CV y publicar órdenes de mérito. | jfc@gmail.com | 123 |
| Administrador (ADMIN) | Manejar los usuarios, los roles y sus permisos. | admin@gmail.com | 123 |

Los mismos usuarios funcionan en producción y en la instalación local.

También se puede crear una cuenta nueva desde **"Creá una"** en el login (queda con rol Postulante). Las contraseñas nuevas deben tener al menos 8 caracteres, con una mayúscula, una minúscula, un número y un carácter especial (por ejemplo `Prueba123!`). Los usuarios de prueba conservan la contraseña `123` porque se crearon antes de esa regla; la regla se aplica al crear o cambiar una contraseña, no al iniciar sesión.

## Estructura del proyecto

```
backend/    API REST en PHP: routes → controllers → services → models
frontend/   Páginas, componentes (Web Components) y servicios en JavaScript
database/   Scripts SQL de la base de datos
checklist/  Listas de verificación de usabilidad y accesibilidad
```
