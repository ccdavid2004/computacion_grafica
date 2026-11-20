import os
import re
from datetime import date
from typing import Generator

import mysql.connector
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import Error, IntegrityError, errorcode
from mysql.connector.connection import MySQLConnection
from pydantic import BaseModel, field_validator


DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "database": "DB_DavidCundar",
    "user": "root",
}

app = FastAPI(title="API CRUD de estudiantes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> Generator[MySQLConnection, None, None]:
    password = os.getenv("MYSQL_PASSWORD")
    if password is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configura la variable de entorno MYSQL_PASSWORD.",
        )

    try:
        connection = mysql.connector.connect(password=password, **DB_CONFIG)
    except Error as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible conectar con la base de datos.",
        ) from exc

    try:
        yield connection
    finally:
        connection.close()


class ProgramaResponse(BaseModel):
    id: int
    nombre: str


class EstudianteInput(BaseModel):
    codigo_estudiante: str
    nombres: str
    apellidos: str
    fecha_nacimiento: date
    genero: str
    programa_id: int
    direccion: str | None = None
    telefono: str | None = None

    @field_validator("codigo_estudiante")
    @classmethod
    def validar_codigo_estudiante(cls, value: str) -> str:
        if re.fullmatch(r"[0-9]+", value) is None:
            raise ValueError("El código de estudiante debe contener solo dígitos.")
        return value

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, value: str | None) -> str | None:
        if value is not None and re.fullmatch(r"[0-9]+", value) is None:
            raise ValueError("El teléfono debe contener solo dígitos.")
        return value

    @field_validator("fecha_nacimiento")
    @classmethod
    def validar_fecha_nacimiento(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura.")
        return value


class EstudianteResponse(EstudianteInput):
    id: int
    programa_nombre: str


@app.get("/programas", response_model=list[ProgramaResponse])
def listar_programas(
    connection: MySQLConnection = Depends(get_connection),
) -> list[dict]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, nombre FROM programas_academicos ORDER BY nombre ASC"
        )
        return cursor.fetchall()
    finally:
        cursor.close()


@app.get("/estudiantes", response_model=list[EstudianteResponse])
def listar_estudiantes(
    connection: MySQLConnection = Depends(get_connection),
) -> list[dict]:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                e.id,
                e.codigo_estudiante,
                e.nombres,
                e.apellidos,
                e.fecha_nacimiento,
                e.genero,
                e.programa_id,
                p.nombre AS programa_nombre,
                e.direccion,
                e.telefono
            FROM formulario_crud AS e
            INNER JOIN programas_academicos AS p ON p.id = e.programa_id
            ORDER BY e.id
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()


@app.post(
    "/estudiantes",
    response_model=EstudianteResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_estudiante(
    estudiante: EstudianteInput,
    connection: MySQLConnection = Depends(get_connection),
) -> dict:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            INSERT INTO formulario_crud (
                codigo_estudiante, nombres, apellidos, fecha_nacimiento,
                genero, programa_id, direccion, telefono
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                estudiante.codigo_estudiante,
                estudiante.nombres,
                estudiante.apellidos,
                estudiante.fecha_nacimiento,
                estudiante.genero,
                estudiante.programa_id,
                estudiante.direccion,
                estudiante.telefono,
            ),
        )
        estudiante_id = cursor.lastrowid
        cursor.execute(
            """
            SELECT
                e.id,
                e.codigo_estudiante,
                e.nombres,
                e.apellidos,
                e.fecha_nacimiento,
                e.genero,
                e.programa_id,
                p.nombre AS programa_nombre,
                e.direccion,
                e.telefono
            FROM formulario_crud AS e
            INNER JOIN programas_academicos AS p ON p.id = e.programa_id
            WHERE e.id = %s
            """,
            (estudiante_id,),
        )
        resultado = cursor.fetchone()
        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible recuperar el estudiante creado.",
            )
        connection.commit()
        return resultado
    except IntegrityError as exc:
        connection.rollback()
        if exc.errno == errorcode.ER_DUP_ENTRY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de estudiante ya se encuentra registrado",
            ) from exc
        if exc.errno == errorcode.ER_NO_REFERENCED_ROW_2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El programa académico indicado no existe.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo registrar el estudiante por una restricción de datos.",
        ) from exc
    except Error as exc:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al registrar el estudiante.",
        ) from exc
    finally:
        cursor.close()


@app.put("/estudiantes/{id}", response_model=EstudianteResponse)
def actualizar_estudiante(
    id: int,
    estudiante: EstudianteInput,
    connection: MySQLConnection = Depends(get_connection),
) -> dict:
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM formulario_crud WHERE id = %s", (id,))
        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estudiante no encontrado.",
            )

        cursor.execute(
            """
            UPDATE formulario_crud
            SET codigo_estudiante = %s,
                nombres = %s,
                apellidos = %s,
                fecha_nacimiento = %s,
                genero = %s,
                programa_id = %s,
                direccion = %s,
                telefono = %s
            WHERE id = %s
            """,
            (
                estudiante.codigo_estudiante,
                estudiante.nombres,
                estudiante.apellidos,
                estudiante.fecha_nacimiento,
                estudiante.genero,
                estudiante.programa_id,
                estudiante.direccion,
                estudiante.telefono,
                id,
            ),
        )
        cursor.execute(
            """
            SELECT
                e.id,
                e.codigo_estudiante,
                e.nombres,
                e.apellidos,
                e.fecha_nacimiento,
                e.genero,
                e.programa_id,
                p.nombre AS programa_nombre,
                e.direccion,
                e.telefono
            FROM formulario_crud AS e
            INNER JOIN programas_academicos AS p ON p.id = e.programa_id
            WHERE e.id = %s
            """,
            (id,),
        )
        resultado = cursor.fetchone()
        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible recuperar el estudiante actualizado.",
            )
        connection.commit()
        return resultado
    except IntegrityError as exc:
        connection.rollback()
        if exc.errno == errorcode.ER_DUP_ENTRY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de estudiante ya se encuentra registrado",
            ) from exc
        if exc.errno == errorcode.ER_NO_REFERENCED_ROW_2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El programa académico indicado no existe.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo actualizar el estudiante por una restricción de datos.",
        ) from exc
    except Error as exc:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al actualizar el estudiante.",
        ) from exc
    finally:
        cursor.close()


@app.delete("/estudiantes/{id}")
def eliminar_estudiante(
    id: int,
    connection: MySQLConnection = Depends(get_connection),
) -> dict[str, str]:
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM formulario_crud WHERE id = %s", (id,))
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estudiante no encontrado.",
            )
        connection.commit()
        return {"mensaje": "Estudiante eliminado correctamente."}
    except Error as exc:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al eliminar el estudiante.",
        ) from exc
    finally:
        cursor.close()
