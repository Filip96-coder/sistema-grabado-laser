import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminResumenResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage implements OnInit {
  private readonly auth = inject(AuthService);

  readonly cargando = signal(true);
  readonly error = signal('');
  readonly resumen = signal<AdminResumenResponse | null>(null);

  readonly metricas = computed(() => {
    const data = this.resumen()?.metrics;

    if (!data) {
      return [];
    }

    return [
      { etiqueta: 'Ordenes totales', valor: data.total_ordenes },
      { etiqueta: 'Terminadas', valor: data.ordenes_terminadas },
      { etiqueta: 'Pendientes', valor: data.ordenes_pendientes },
      { etiqueta: 'Clientes activos', valor: data.clientes_activos },
      { etiqueta: 'Materiales activos', valor: data.materiales_activos },
    ];
  });

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando.set(true);
    this.error.set('');

    this.auth.getAdminResumen().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo cargar el panel administrativo.');
        this.cargando.set(false);
      },
    });
  }

  get username(): string {
    return this.resumen()?.session.username ?? this.auth.getUsername();
  }
}
