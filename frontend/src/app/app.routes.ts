import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin-page/admin-page').then((m) => m.AdminPage),
  },
  {
    path: 'ordenes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/ordenes-list/ordenes-list').then((m) => m.OrdenesList),
  },
  {
    path: 'ordenes/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./components/orden-form/orden-form').then((m) => m.OrdenForm),
  },
  {
    path: 'ordenes/editar/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/orden-form/orden-form').then((m) => m.OrdenForm),
  },
  {
    path: 'informes',
    canActivate: [authGuard],
    loadComponent: () => import('./components/informe-xml/informe-xml').then((m) => m.InformeXml),
  },
  { path: 'informe', redirectTo: 'informes', pathMatch: 'full' },
  { path: '**', redirectTo: 'ordenes' },
];
