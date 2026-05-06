import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdenTrabajo } from '../models/orden.model';

@Injectable({ providedIn: 'root' })
export class Ordenes {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api-grabados-backend.onrender.com/api';

  // Estado temporal para pasar la orden al formulario de edición
  private _ordenEnEdicion: OrdenTrabajo | null = null;

  // ── CRUD ──────────────────────────────────────────────────────────────

  getOrdenes(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(`${this.apiUrl}/ordenes`);
  }

  crearOrden(orden: Omit<OrdenTrabajo, '_id' | 'createdAt' | 'updatedAt'>): Observable<OrdenTrabajo> {
    return this.http.post<OrdenTrabajo>(`${this.apiUrl}/ordenes`, orden);
  }

  actualizarOrden(id: string, orden: Partial<OrdenTrabajo>): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.apiUrl}/ordenes/${id}`, orden);
  }

  eliminarOrden(id: string): Observable<{ mensaje: string; id: string }> {
    return this.http.delete<{ mensaje: string; id: string }>(`${this.apiUrl}/ordenes/${id}`);
  }

  // ── Informe XML ───────────────────────────────────────────────────────
  // responseType: 'text' necesario porque el backend devuelve application/xml

  getInformeXML(): Observable<string> {
    return this.http.get(`${this.apiUrl}/informes/operacion`, { responseType: 'text' });
  }

  // ── Estado para edición ───────────────────────────────────────────────

  setOrdenEnEdicion(orden: OrdenTrabajo): void {
    this._ordenEnEdicion = orden;
  }

  getOrdenEnEdicion(): OrdenTrabajo | null {
    return this._ordenEnEdicion;
  }

  clearOrdenEnEdicion(): void {
    this._ordenEnEdicion = null;
  }
}
