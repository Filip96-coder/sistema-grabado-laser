import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { AdminResumenResponse, LoginResponse, SessionInfo } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'laser-auth-session';
  private readonly apiUrl = this.resolverApiUrl();

  readonly session = signal<SessionInfo | null>(this.leerSesion());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(tap((response) => this.guardarSesion(response.token, response.session)));
  }

  getAdminResumen(): Observable<AdminResumenResponse> {
    return this.http.get<AdminResumenResponse>(`${this.apiUrl}/admin/resumen`);
  }

  isAuthenticated(): boolean {
    return Boolean(this.obtenerToken());
  }

  getUsername(): string {
    return this.session()?.username ?? 'Administrador';
  }

  obtenerToken(): string | null {
    return this.leerStorage()?.token ?? null;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.session.set(null);
  }

  private guardarSesion(token: string, session: SessionInfo): void {
    localStorage.setItem(this.storageKey, JSON.stringify({ token, session }));
    this.session.set(session);
  }

  private leerSesion(): SessionInfo | null {
    return this.leerStorage()?.session ?? null;
  }

  private leerStorage(): { token: string; session: SessionInfo } | null {
    try {
      const raw = localStorage.getItem(this.storageKey);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as { token: string; session: SessionInfo };
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private resolverApiUrl(): string {
    const host = globalThis.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }

    return '/api';
  }
}
