import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Ordenes } from '../../services/ordenes';

@Component({
  selector: 'app-orden-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './orden-form.html',
  styleUrl: './orden-form.css',
})
export class OrdenForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(Ordenes);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  esEdicion = signal(false);
  ordenId = signal<string | null>(null);
  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    cliente: ['', Validators.required],
    objeto: ['', Validators.required],
    material: ['', Validators.required],
    parametros_laser: this.fb.group({
      potencia: [null as number | null],
      velocidad: [null as number | null],
    }),
    estado: ['Pendiente' as 'Pendiente' | 'Terminado', Validators.required],
    precio_cop: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.esEdicion.set(true);
    this.ordenId.set(id);

    const orden = this.service.getOrdenEnEdicion();
    if (orden) {
      this.form.patchValue({
        cliente: orden.cliente,
        objeto: orden.objeto,
        material: orden.material,
        parametros_laser: {
          potencia: orden.parametros_laser?.potencia ?? null,
          velocidad: orden.parametros_laser?.velocidad ?? null,
        },
        estado: orden.estado,
        precio_cop: orden.precio_cop,
      });
    } else {
      // Fallback: si el usuario recargó la página, redirigir a la lista
      this.router.navigate(['/ordenes']);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const payload = this.form.getRawValue() as any;

    const operacion$ = this.esEdicion()
      ? this.service.actualizarOrden(this.ordenId()!, payload)
      : this.service.crearOrden(payload);

    operacion$.subscribe({
      next: () => {
        this.service.clearOrdenEnEdicion();
        this.router.navigate(['/ordenes']);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Error al guardar la orden. Intenta de nuevo.');
        this.guardando.set(false);
      },
    });
  }

  campoInvalido(path: string): boolean {
    const ctrl = this.form.get(path);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
