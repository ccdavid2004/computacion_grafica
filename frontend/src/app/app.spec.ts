import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { EstudianteService } from './services/estudiante.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: EstudianteService,
          useValue: {
            getProgramas: () => of([]),
            getEstudiantes: () => of([]),
          },
        },
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the academic management interface', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Gestión de estudiantes');
    expect(compiled.textContent).toContain('Registrar estudiante');
    expect(compiled.textContent).toContain('Estudiantes registrados');
  });
});
