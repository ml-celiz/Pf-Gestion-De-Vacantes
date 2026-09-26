# Sistema de Gestión de Vacantes - UTN FRRO

Sistema web para publicar vacantes docentes de la UTN Facultad Regional Rosario, recibir postulaciones de los interesados (con su CV) y publicar las órdenes de mérito. Cuando un postulante es aceptado se le notifica por correo electrónico.

**URL de producción:** _(completar)_

**Repositorio:** _(completar)_

## Integrantes

- _(completar)_

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Web Components), Bootstrap 5 y Bootstrap Icons.
- **Backend:** PHP 8 (API REST, sin frameworks).
- **Base de datos:** PostgreSQL.
- **Correo:** SMTP (Gmail).

## Roles y usuarios de prueba

| Rol | Qué puede hacer | Usuario | Contraseña |
|---|---|---|---|
| Invitado (INV) | Solo ver las vacantes abiertas, sin iniciar sesión. | Botón **"Acceder como invitado"** del login | — |
| Postulante (POS) | Postularse a vacantes y seguir sus postulaciones. | pos@gmail.com | _(completar)_ |
| Responsable Administrativo (RA) | Abrir y cerrar vacantes. | ra@gmail.com | _(completar)_ |
| Jefe de cátedra (JFC) | Ver vacantes y publicar órdenes de mérito. | jfc@gmail.com | _(completar)_ |
| Administrador (ADMIN) | Manejar los usuarios y sus permisos. | admin@gmail.com | _(completar)_ |

También se puede crear una cuenta nueva desde **"Creá una"** en el login (queda con rol Postulante).

## Instalación local

1. Crear la base en PostgreSQL ejecutando, en orden, los scripts de `database/`.
2. Copiar `backend/.env.example` como `backend/.env` y completar los datos de la base y del correo.
3. Levantar el backend:
   ```
   cd backend
   C:\xampp\php\php.exe -S localhost:8000 main.php
   ```
4. Levantar el frontend:
   ```
   cd frontend
   C:\xampp\php\php.exe -S localhost:5500
   ```
5. Abrir http://localhost:5500

## Despliegue

- Subir las carpetas `frontend/` y `backend/` al hosting (Apache con PHP 8 y PostgreSQL).
- El frontend llama a la API en `/backend/api` del mismo dominio (ver `frontend/services/config.js`).
- En `backend/.env` de producción, `APP_URL` debe ser la URL pública del frontend (se usa en los links de los correos).
