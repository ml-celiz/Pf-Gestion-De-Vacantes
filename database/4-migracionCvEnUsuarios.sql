--- MIGRACION: EL CV PASA DE LA SOLICITUD AL USUARIO ---
-- Ejecutar DESPUES de 1, 2 y 3.
-- El CV es un dato de la persona: se sube una vez y se reutiliza en todas
-- sus postulaciones (y ya no impide crear una solicitud sin CV).

BEGIN;

-- 1) el usuario pasa a tener CV (opcional)
ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS cv character varying;

-- 2) conservar los CV ya cargados: se toma el de la postulacion mas reciente de cada usuario
UPDATE public.usuarios u
SET cv = s.cv
FROM (
    SELECT DISTINCT ON (id_usuario) id_usuario, cv
    FROM public.solicitudes_vacantes
    WHERE cv IS NOT NULL AND cv <> ''
    ORDER BY id_usuario, fecha_postulacion DESC
) s
WHERE u.id = s.id_usuario
  AND u.cv IS NULL;

-- 3) la solicitud deja de guardar el CV
ALTER TABLE public.solicitudes_vacantes
    DROP COLUMN IF EXISTS cv;

COMMIT;
