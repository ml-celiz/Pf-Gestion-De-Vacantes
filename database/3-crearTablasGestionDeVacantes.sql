--- GESTION DE VACANTES ---

BEGIN;

-- estados
CREATE TABLE public.estados
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.estados
    OWNER to postgres;

GRANT ALL ON TABLE public.estados TO postgres;
GRANT ALL ON SEQUENCE public.estados_id_seq TO postgres;

-- insertar estados
INSERT INTO public.estados (nombre) 
VALUES 
    ('ABIERTA'),
    ('CERRADA'),
    ('EVALUADA'),
    ('PENDIENTE'),
    ('ACEPTADA'),
    ('CANCELADA');

-- vacantes
CREATE TABLE public.vacantes
(
    id serial NOT NULL,
    titulo character varying(50),
    descripcion character varying(50),
    requisitos jsonb,
    inicio timestamp with time zone NOT NULL,
    fin timestamp with time zone,
    id_estado integer NOT NULL,
    id_catedra integer NOT NULL,
    id_usuario integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_estado_fk FOREIGN KEY (id_estado)
        REFERENCES public.estados (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_catedra_fk FOREIGN KEY (id_catedra)
        REFERENCES public.catedras (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_usuario_fk FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.vacantes
    OWNER to postgres;

GRANT ALL ON TABLE public.vacantes TO postgres;
GRANT ALL ON SEQUENCE public.vacantes_id_seq TO postgres;

-- solicitudes_vacantes
CREATE TABLE public.solicitudes_vacantes
(
    id serial NOT NULL,
    fecha_postulacion timestamp with time zone NOT NULL,
    id_estado integer NOT NULL,
    id_vacante integer NOT NULL,
    id_usuario integer NOT NULL,
    fecha_baja timestamp with time zone,
    notificado boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT id_estado_fk FOREIGN KEY (id_estado)
        REFERENCES public.estados (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_vacante_fk FOREIGN KEY (id_vacante)
        REFERENCES public.vacantes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_usuario_fk FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.solicitudes_vacantes
    OWNER to postgres;

GRANT ALL ON TABLE public.solicitudes_vacantes TO postgres;
GRANT ALL ON SEQUENCE public.solicitudes_vacantes_id_seq TO postgres;

-- ordenes_merito
CREATE TABLE public.ordenes_merito
(
    id serial NOT NULL,
    puntaje integer NOT NULL,
    posicion integer NOT NULL,
    observaciones text,
    fecha_publicacion timestamp with time zone NOT NULL,
    id_solicitud integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_solicitud_fk FOREIGN KEY (id_solicitud)
        REFERENCES public.solicitudes_vacantes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.ordenes_merito
    OWNER to postgres;

GRANT ALL ON TABLE public.ordenes_merito TO postgres;
GRANT ALL ON SEQUENCE public.ordenes_merito_id_seq TO postgres;

COMMIT;