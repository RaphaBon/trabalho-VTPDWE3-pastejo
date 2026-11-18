-- Cria o banco pastejo com dados de exemplo.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela pai de piquete (1:N). areatotal em hectares. removido = soft delete.
CREATE TABLE IF NOT EXISTS pasto (
    pastoid     bigserial CONSTRAINT pk_pasto PRIMARY KEY,
    descricao   varchar(60)   NOT NULL,
    areatotal   numeric(10,2) NOT NULL,
    removido    boolean       DEFAULT false
);

INSERT INTO pasto VALUES
    (default, 'Pasto da Represa', 42.50),
    (default, 'Pasto do Morro',   28.75)
ON CONFLICT DO NOTHING;

-- Filha de pasto e pai de alocado. latitude/longitude com 6 casas.
CREATE TABLE IF NOT EXISTS piquete (
    piqueteid   bigserial CONSTRAINT pk_piquete PRIMARY KEY,
    descricao   varchar(60)   NOT NULL,
    latitude    numeric(9,6)  NOT NULL,
    longitude   numeric(9,6)  NOT NULL,
    pastoidfk   bigint CONSTRAINT fk_piquete_pasto REFERENCES pasto,
    removido    boolean       DEFAULT false
);

INSERT INTO piquete VALUES
    (default, 'Piquete 1 - Represa', -20.421530, -49.972810,
        (SELECT pastoid FROM pasto WHERE descricao = 'Pasto da Represa')),
    (default, 'Piquete 2 - Represa', -20.422870, -49.974120,
        (SELECT pastoid FROM pasto WHERE descricao = 'Pasto da Represa')),
    (default, 'Piquete 1 - Morro',   -20.430410, -49.965330,
        (SELECT pastoid FROM pasto WHERE descricao = 'Pasto do Morro'))
ON CONFLICT DO NOTHING;

-- Tabela pai de alocado (1:N).
CREATE TABLE IF NOT EXISTS animal (
    animalid    bigserial CONSTRAINT pk_animal PRIMARY KEY,
    nome        varchar(50)   NOT NULL,
    datanasc    date          NOT NULL,
    removido    boolean       DEFAULT false
);

INSERT INTO animal VALUES
    (default, 'Mimosa',  '2022-03-15'),
    (default, 'Estrela', '2021-08-02'),
    (default, 'Trovão',  '2020-11-20')
ON CONFLICT DO NOTHING;

-- Resolve o N:N entre animal e piquete. datafinal NULL = animal ainda no piquete.
-- O CHECK impede período invertido (datafinal antes de datainicio).
CREATE TABLE IF NOT EXISTS alocado (
    alocadoid    bigserial CONSTRAINT pk_alocado PRIMARY KEY,
    animalidifk  bigint CONSTRAINT fk_alocado_animal  REFERENCES animal,
    piqueteidfk  bigint CONSTRAINT fk_alocado_piquete REFERENCES piquete,
    datainicio   date          NOT NULL,
    datafinal    date,
    removido     boolean       DEFAULT false,
    CONSTRAINT ck_alocado_periodo CHECK (datafinal IS NULL OR datafinal >= datainicio)
);

INSERT INTO alocado VALUES
    (default, (SELECT animalid FROM animal WHERE nome = 'Mimosa'),
              (SELECT piqueteid FROM piquete WHERE descricao = 'Piquete 1 - Represa'),
              '2026-10-01', '2026-10-20'),
    (default, (SELECT animalid FROM animal WHERE nome = 'Mimosa'),
              (SELECT piqueteid FROM piquete WHERE descricao = 'Piquete 2 - Represa'),
              '2026-10-21', null),
    (default, (SELECT animalid FROM animal WHERE nome = 'Estrela'),
              (SELECT piqueteid FROM piquete WHERE descricao = 'Piquete 1 - Morro'),
              '2026-11-01', null)
ON CONFLICT DO NOTHING;

-- Usuários do login.
CREATE TABLE IF NOT EXISTS usuarios (
    usuarioid bigserial CONSTRAINT pk_usuarios PRIMARY KEY,
    username  varchar(20) UNIQUE,
    password  text,
    removido  boolean DEFAULT false
);

-- Senhas gravadas com bcrypt (crypt + gen_salt).
INSERT INTO usuarios VALUES
    (default, 'admin', crypt('admin', gen_salt('bf'))),
    (default, 'qwe',   crypt('qwe',   gen_salt('bf')))
ON CONFLICT DO NOTHING;
