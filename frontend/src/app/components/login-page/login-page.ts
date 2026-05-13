import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();

    this.cargando.set(true);
    this.error.set('');

    this.auth.login(username?.trim() ?? '', password ?? '').subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  campoInvalido(path: 'username' | 'password'): boolean {
    const control = this.form.get(path);
    return !!(control?.invalid && control?.touched);
  }
}
