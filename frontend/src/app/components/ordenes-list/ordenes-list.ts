import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { Ordenes } from '../../services/ordenes';
import { OrdenTrabajo } from '../../models/orden.model';

@Component({
  selector: 'app-ordenes-list',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './ordenes-list.html',
  styleUrl: './ordenes-list.css',
})
export class OrdenesList implements OnInit {
  private readonly service = inject(Ordenes);
  private readonly router = inject(Router);

  ordenes = signal<OrdenTrabajo[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.cargando.set(true);
    this.error.set('');
    this.service.getOrdenes().subscribe({
      next: (data) => {
        this.ordenes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No se pudo conectar al servidor. Verifica que el backend esté activo en http://localhost:3000'
        );
        this.cargando.set(false);
      },
    });
  }

  editar(orden: OrdenTrabajo): void {
    this.service.setOrdenEnEdicion(orden);
    this.router.navigate(['/ordenes/editar', orden._id]);
  }

  eliminar(id: string, cliente: string): void {
    if (!confirm(`¿Eliminar la orden de "${cliente}"?\nEsta acción no se puede deshacer.`)) return;

    this.service.eliminarOrden(id).subscribe({
      next: () => this.cargarOrdenes(),
      error: () => this.error.set('Error al eliminar la orden. Intenta de nuevo.'),
    });
  }
}
