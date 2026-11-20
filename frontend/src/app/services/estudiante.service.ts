import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Programa {
  id: number;
  nombre: string;
}

export interface Estudiante {
  id?: number;
  codigo_estudiante: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  programa_id: number;
  programa_nombre?: string;
  direccion: string;
  telefono: string;
}

@Injectable({
  providedIn: 'root',
})
export class EstudianteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000';

  getProgramas(): Observable<Programa[]> {
    return this.http.get<Programa[]>(`${this.apiUrl}/programas`);
  }

  getEstudiantes(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(`${this.apiUrl}/estudiantes`);
  }

  crearEstudiante(data: Estudiante): Observable<Estudiante> {
    return this.http.post<Estudiante>(`${this.apiUrl}/estudiantes`, data);
  }

  actualizarEstudiante(id: number, data: Estudiante): Observable<Estudiante> {
    return this.http.put<Estudiante>(`${this.apiUrl}/estudiantes/${id}`, data);
  }

  eliminarEstudiante(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/estudiantes/${id}`,
    );
  }
}
