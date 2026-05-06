import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'ordenes', pathMatch: 'full' },
  {
    path: 'ordenes',
    loadComponent: () =>
      import('./components/ordenes-list/ordenes-list').then((m) => m.OrdenesList),
  },
  {
    path: 'ordenes/nueva',
    loadComponent: () =>
      import('./components/orden-form/orden-form').then((m) => m.OrdenForm),
  },
  {
    path: 'ordenes/editar/:id',
    loadComponent: () =>
      import('./components/orden-form/orden-form').then((m) => m.OrdenForm),
  },
  {
    path: 'informe',
    loadComponent: () =>
      import('./components/informe-xml/informe-xml').then((m) => m.InformeXml),
  },
  { path: '**', redirectTo: 'ordenes' },
];
