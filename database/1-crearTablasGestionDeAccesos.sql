--- GESTION DE ACCESOS ---

BEGIN; 

-- usuarios
CREATE TABLE public.usuarios
(
    id serial NOT NULL,
    email character varying(50) NOT NULL,
    nombre character varying(50),
    apellido character varying(50),
    contrasena character varying(255) NOT NULL,
    dni integer,
    telefono character varying,
    fecha_alta timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone,
    fecha_baja timestamp with time zone,
    cv_path character varying,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.usuarios
    OWNER to postgres;

GRANT ALL ON TABLE public.usuarios TO postgres;
GRANT ALL ON SEQUENCE public.usuarios_id_seq TO postgres;

-- roles
CREATE TABLE public.roles
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;

GRANT ALL ON TABLE public.roles TO postgres;
GRANT ALL ON SEQUENCE public.roles_id_seq TO postgres;

-- se añade token_duracion
ALTER TABLE public.roles
ADD COLUMN token_duracion INTEGER NOT NULL DEFAULT 60;

-- paneles
CREATE TABLE public.paneles
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.paneles
    OWNER to postgres;

GRANT ALL ON TABLE public.paneles TO postgres;
GRANT ALL ON SEQUENCE public.paneles_id_seq TO postgres;

-- modulos
CREATE TABLE public.modulos
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.modulos
    OWNER to postgres;

GRANT ALL ON TABLE public.modulos TO postgres;
GRANT ALL ON SEQUENCE public.modulos_id_seq TO postgres;

-- sesiones
CREATE TABLE public.sesiones
(
    id serial NOT NULL,
    token character varying NOT NULL,
    fecha_login timestamp with time zone NOT NULL,
    fecha_logout timestamp with time zone,
    activo boolean NOT NULL,
    id_usuario integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_usuario_fk FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.sesiones
    OWNER to postgres;

GRANT ALL ON TABLE public.sesiones TO postgres;
GRANT ALL ON SEQUENCE public.sesiones_id_seq TO postgres;

-- se añade fecha_expiracion para saber cuando vence la sesion
ALTER TABLE public.sesiones
ADD COLUMN fecha_expiracion timestamp with time zone;

-- roles_paneles
CREATE TABLE public.roles_paneles
(
    id serial NOT NULL,
    id_rol integer NOT NULL,
    id_panel integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_rol_fk FOREIGN KEY (id_rol)
        REFERENCES public.roles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_panel_fk FOREIGN KEY (id_panel)
        REFERENCES public.paneles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.roles_paneles
    OWNER to postgres;

GRANT ALL ON TABLE public.roles_paneles TO postgres;
GRANT ALL ON SEQUENCE public.roles_paneles_id_seq TO postgres;

-- roles_modulos
CREATE TABLE public.roles_modulos
(
    id serial NOT NULL,
    editar boolean,
    escribir boolean,
    leer boolean,
    id_rol integer NOT NULL,
    id_modulo integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_rol_fk FOREIGN KEY (id_rol)
        REFERENCES public.roles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_modulo FOREIGN KEY (id_modulo)
        REFERENCES public.modulos (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.roles_modulos
    OWNER to postgres;

GRANT ALL ON TABLE public.roles_modulos TO postgres;
GRANT ALL ON SEQUENCE public.roles_modulos_id_seq TO postgres;

-- roles_usuarios
CREATE TABLE public.roles_usuarios
(
    id serial NOT NULL,
    id_rol integer NOT NULL,
    id_usuario integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_rol_fk FOREIGN KEY (id_rol)
        REFERENCES public.roles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_usuario_fk FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.roles_usuarios
    OWNER to postgres;

GRANT ALL ON TABLE public.roles_usuarios TO postgres;
GRANT ALL ON SEQUENCE public.roles_usuarios_id_seq TO postgres;

COMMIT;