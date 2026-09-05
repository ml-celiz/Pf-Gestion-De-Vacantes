--- GESTION INSTITUCIONAL ---

BEGIN;
-- departamentos
CREATE TABLE public.departamentos
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.departamentos
    OWNER to postgres;

GRANT ALL ON TABLE public.departamentos TO postgres;
GRANT ALL ON SEQUENCE public.departamentos_id_seq TO postgres;

-- catedras
CREATE TABLE public.catedras
(
    id serial NOT NULL,
    nombre character varying(50) NOT NULL,
    id_departamento integer NOT NULL,
    id_usuario integer NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT id_departamento_fk FOREIGN KEY (id_departamento)
        REFERENCES public.departamentos (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT id_usuario_fk FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS public.catedras
    OWNER to postgres;

GRANT ALL ON TABLE public.catedras TO postgres;
GRANT ALL ON SEQUENCE public.catedras_id_seq TO postgres;

COMMIT;