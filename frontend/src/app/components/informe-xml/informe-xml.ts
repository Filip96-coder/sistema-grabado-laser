import { Component, OnInit, inject, signal } from '@angular/core';
import { Ordenes } from '../../services/ordenes';

@Component({
  selector: 'app-informe-xml',
  imports: [],
  templateUrl: './informe-xml.html',
  styleUrl: './informe-xml.css',
})
export class InformeXml implements OnInit {
  private readonly service = inject(Ordenes);

  xmlContent = signal('');
  cargando = signal(false);
  error = signal('');
  copiado = signal(false);

  ngOnInit(): void {
    this.cargarInforme();
  }

  cargarInforme(): void {
    this.cargando.set(true);
    this.error.set('');
    this.xmlContent.set('');

    this.service.getInformeXML().subscribe({
      next: (xml) => {
        this.xmlContent.set(xml);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No se pudo generar el informe. Verifica que el backend esté activo en http://localhost:3000'
        );
        this.cargando.set(false);
      },
    });
  }

  copiarXML(): void {
    navigator.clipboard.writeText(this.xmlContent()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
