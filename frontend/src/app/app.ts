import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import {
  Estudiante,
  EstudianteService,
  Programa,
} from './services/estudiante.service';

@Component({
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly estudianteService = inject(EstudianteService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly hoy = new Date();
  readonly generos = [
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Otro', value: 'Otro' },
  ];
  readonly programas = signal<Programa[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  estudianteEnEdicion: number | null = null;
  enviado = false;

  readonly formulario = this.formBuilder.nonNullable.group({
    codigo_estudiante: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    fecha_nacimiento: this.formBuilder.control<Date | null>(
      null,
      Validators.required,
    ),
    genero: ['', Validators.required],
    programa_id: this.formBuilder.control<number | null>(null, Validators.required),
    direccion: [''],
    telefono: ['', Validators.pattern(/^[0-9]*$/)],
  });

  ngOnInit(): void {
    this.cargarProgramas();
    this.cargarEstudiantes();
  }

  cargarProgramas(): void {
    this.estudianteService.getProgramas().subscribe({
      next: (programas) => {
        this.programas.set(programas);
      },
      error: (error: HttpErrorResponse) => this.mostrarError(error),
    });
  }

  cargarEstudiantes(): void {
    this.estudianteService.getEstudiantes().subscribe({
      next: (estudiantes) => {
        this.estudiantes.set(estudiantes);
      },
      error: (error: HttpErrorResponse) => this.mostrarError(error),
    });
  }

  guardarEstudiante(): void {
    this.enviado = true;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const fechaNacimiento = valores.fecha_nacimiento;
    const programaId = valores.programa_id;
    if (!fechaNacimiento || programaId === null) {
      return;
    }

    const data: Estudiante = {
      codigo_estudiante: valores.codigo_estudiante,
      nombres: valores.nombres,
      apellidos: valores.apellidos,
      fecha_nacimiento: this.formatearFechaApi(fechaNacimiento),
      genero: valores.genero,
      programa_id: programaId,
      direccion: valores.direccion,
      telefono: valores.telefono,
    };

    if (this.estudianteEnEdicion === null) {
      this.estudianteService.crearEstudiante(data).subscribe({
        next: () => {
          this.mostrarExito('Estudiante registrado correctamente.');
          this.limpiarFormulario();
          this.cargarEstudiantes();
        },
        error: (error: HttpErrorResponse) => this.mostrarError(error),
      });
      return;
    }

    this.estudianteService
      .actualizarEstudiante(this.estudianteEnEdicion, data)
      .subscribe({
        next: () => {
          this.mostrarExito('Estudiante actualizado correctamente.');
          this.limpiarFormulario();
          this.cargarEstudiantes();
        },
        error: (error: HttpErrorResponse) => this.mostrarError(error),
      });
  }

  editarEstudiante(estudiante: Estudiante): void {
    if (estudiante.id === undefined) {
      return;
    }

    this.estudianteEnEdicion = estudiante.id;
    this.enviado = false;
    this.formulario.reset({
      codigo_estudiante: estudiante.codigo_estudiante,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      fecha_nacimiento: this.parsearFecha(estudiante.fecha_nacimiento),
      genero: estudiante.genero,
      programa_id: estudiante.programa_id,
      direccion: estudiante.direccion,
      telefono: estudiante.telefono,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmarEliminacion(estudiante: Estudiante): void {
    if (estudiante.id === undefined) {
      return;
    }
    const id = estudiante.id;

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Deseas eliminar a ${estudiante.nombres} ${estudiante.apellidos}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.eliminarEstudiante(id),
    });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  obtenerFechaLegible(fecha: string): string {
    const date = this.parsearFecha(fecha);
    if (!date) {
      return fecha;
    }
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private eliminarEstudiante(id: number): void {
    this.estudianteService.eliminarEstudiante(id).subscribe({
      next: (respuesta) => {
        this.mostrarExito(respuesta.mensaje || 'Estudiante eliminado correctamente.');
        this.cargarEstudiantes();
      },
      error: (error: HttpErrorResponse) => this.mostrarError(error),
    });
  }

  private limpiarFormulario(): void {
    this.estudianteEnEdicion = null;
    this.enviado = false;
    this.formulario.reset({
      codigo_estudiante: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: null,
      genero: '',
      programa_id: null,
      direccion: '',
      telefono: '',
    });
  }

  private formatearFechaApi(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private parsearFecha(fecha: string): Date | null {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
    if (!coincidencia) {
      return null;
    }
    return new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3]),
    );
  }

  private mostrarExito(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Correcto', detail });
  }

  private mostrarError(error: HttpErrorResponse): void {
    const detail =
      typeof error.error?.detail === 'string'
        ? error.error.detail
        : error.status === 0
          ? 'No se pudo conectar con http://127.0.0.1:8000. Verifica que la API esté activa y permita CORS desde http://localhost:4200.'
          : 'No fue posible completar la operación. Verifica la conexión con el servidor.';
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
