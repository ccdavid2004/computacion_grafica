CREATE DATABASE IF NOT EXISTS DB_DavidCundar
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE DB_DavidCundar;

CREATE TABLE IF NOT EXISTS programas_academicos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_programas_academicos_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS formulario_crud (
    id INT NOT NULL AUTO_INCREMENT,
    codigo_estudiante VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(30) NOT NULL,
    programa_id INT NOT NULL,
    direccion VARCHAR(150),
    telefono VARCHAR(20),
    PRIMARY KEY (id),
    UNIQUE KEY uq_formulario_crud_codigo_estudiante (codigo_estudiante),
    CONSTRAINT fk_formulario_crud_programa
        FOREIGN KEY (programa_id)
        REFERENCES programas_academicos (id)
) ENGINE=InnoDB;

INSERT INTO programas_academicos (nombre) VALUES
    ('Administración de Empresas'),
    ('Arquitectura'),
    ('Biología'),
    ('Contaduría Pública'),
    ('Derecho'),
    ('Ingeniería Civil'),
    ('Ingeniería de Sistemas'),
    ('Licenciatura en Matemáticas'),
    ('Medicina'),
    ('Psicología');