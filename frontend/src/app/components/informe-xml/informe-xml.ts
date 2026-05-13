import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Ordenes } from '../../services/ordenes';

type TipoInforme = 'materiales' | 'ordenes';

interface InformeItem {
  readonly id: TipoInforme;
  readonly titulo: string;
  readonly descripcion: string;
  readonly archivo: string;
}

interface ResumenInforme {
  readonly totalOrdenes: string;
  readonly terminadas: string;
  readonly pendientes: string;
  readonly valorTotal: string;
}

interface MaterialDetalle {
  readonly nombre: string;
  readonly cantidad: string;
  readonly xml: string;
}

interface ClienteDetalle {
  readonly nombre: string;
  readonly cantidad: string;
  readonly xml: string;
}

interface InformeProcesado {
  readonly resumen: ResumenInforme;
  readonly totalMateriales?: number;
  readonly totalClientes?: number;
}

@Component({
  selector: 'app-informe-xml',
  imports: [],
  templateUrl: './informe-xml.html',
  styleUrl: './informe-xml.css',
})
export class InformeXml implements OnInit {
  private readonly service = inject(Ordenes);

  readonly informes: readonly InformeItem[] = [
    {
      id: 'materiales',
      titulo: 'Ordenes por material',
      descripcion: 'Mira el XML agrupado por material y entra a una vista puntual por bloque.',
      archivo: 'ordenes_por_material.xml',
    },
    {
      id: 'ordenes',
      titulo: 'Ordenes por cliente',
      descripcion: 'Explora el XML plano y filtra rapido por cliente para revisar sus ordenes.',
      archivo: 'informe_ordenes.xml',
    },
  ];

  informeActivo = signal<TipoInforme>('materiales');
  xmlMateriales = signal('');
  xmlOrdenes = signal('');
  materiales = signal<MaterialDetalle[]>([]);
  clientes = signal<ClienteDetalle[]>([]);
  materialSeleccionado = signal<MaterialDetalle | null>(null);
  clienteSeleccionado = signal<ClienteDetalle | null>(null);
  resumenMateriales = signal<ResumenInforme | null>(null);
  resumenOrdenes = signal<ResumenInforme | null>(null);
  cargando = signal(false);
  error = signal('');
  copiado = signal(false);

  readonly resumenActivo = computed(() =>
    this.informeActivo() === 'materiales' ? this.resumenMateriales() : this.resumenOrdenes(),
  );

  readonly statsActivos = computed(() => {
    const resumen = this.resumenActivo();

    if (!resumen) {
      return [];
    }

    const stats = [
      { etiqueta: 'Ordenes totales', valor: resumen.totalOrdenes },
      { etiqueta: 'Terminadas', valor: resumen.terminadas },
      { etiqueta: 'Pendientes', valor: resumen.pendientes },
      { etiqueta: 'Valor total', valor: resumen.valorTotal },
    ];

    if (this.informeActivo() === 'materiales') {
      stats.push({ etiqueta: 'Materiales', valor: String(this.materiales().length) });
    } else {
      stats.push({ etiqueta: 'Clientes', valor: String(this.clientes().length) });
    }

    return stats;
  });

  ngOnInit(): void {
    this.cargarInformes();
  }

  cargarInformes(): void {
    this.cargando.set(true);
    this.error.set('');
    this.copiado.set(false);

    forkJoin({
      materiales: this.service.getInformeMaterialesXML(),
      ordenes: this.service.getInformeOrdenesXML(),
    }).subscribe({
      next: ({ materiales, ordenes }) => {
        this.xmlMateriales.set(materiales);
        this.xmlOrdenes.set(ordenes);

        const informeMateriales = this.procesarInformeMateriales(materiales);
        const informeOrdenes = this.procesarInformeOrdenes(ordenes);

        this.materiales.set(informeMateriales.materiales);
        this.materialSeleccionado.set(informeMateriales.materiales[0] ?? null);
        this.resumenMateriales.set(informeMateriales.resumen);

        this.clientes.set(informeOrdenes.clientes);
        this.clienteSeleccionado.set(informeOrdenes.clientes[0] ?? null);
        this.resumenOrdenes.set(informeOrdenes.resumen);

        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No se pudieron generar los informes. Verifica que el backend este activo en http://localhost:3000',
        );
        this.cargando.set(false);
      },
    });
  }

  seleccionarInforme(tipo: TipoInforme): void {
    this.informeActivo.set(tipo);
  }

  seleccionarMaterial(material: MaterialDetalle): void {
    this.informeActivo.set('materiales');
    this.materialSeleccionado.set(material);
  }

  seleccionarCliente(cliente: ClienteDetalle): void {
    this.informeActivo.set('ordenes');
    this.clienteSeleccionado.set(cliente);
  }

  copiarXML(): void {
    navigator.clipboard.writeText(this.xmlActivo()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  xmlActivo(): string {
    return this.informeActivo() === 'materiales' ? this.xmlMateriales() : this.xmlOrdenes();
  }

  archivoActivo(): string {
    return (
      this.informes.find((informe) => informe.id === this.informeActivo())?.archivo ?? 'informe.xml'
    );
  }

  detalleActivoTitulo(): string {
    if (this.informeActivo() === 'materiales') {
      return this.materialSeleccionado()?.nombre ?? 'Selecciona un material';
    }

    return this.clienteSeleccionado()?.nombre ?? 'Selecciona un cliente';
  }

  detalleActivoCantidad(): string {
    if (this.informeActivo() === 'materiales') {
      return this.materialSeleccionado()?.cantidad ?? '0';
    }

    return this.clienteSeleccionado()?.cantidad ?? '0';
  }

  detalleActivoEtiqueta(): string {
    return this.informeActivo() === 'materiales'
      ? 'Vista puntual por material'
      : 'Vista puntual por cliente';
  }

  detalleActivoXml(): string {
    if (this.informeActivo() === 'materiales') {
      return this.materialSeleccionado()?.xml ?? '';
    }

    return this.clienteSeleccionado()?.xml ?? '';
  }

  tieneDetalleActivo(): boolean {
    return this.informeActivo() === 'materiales'
      ? this.materialSeleccionado() !== null
      : this.clienteSeleccionado() !== null;
  }

  private procesarInformeMateriales(
    xml: string,
  ): InformeProcesado & { materiales: MaterialDetalle[] } {
    const documento = this.parsearXml(xml);

    if (!documento) {
      return {
        resumen: this.resumenVacio(),
        materiales: [],
        totalMateriales: 0,
      };
    }

    const serializer = new XMLSerializer();
    const materiales = Array.from(documento.getElementsByTagName('material')).map((material) => ({
      nombre: material.getAttribute('nombre') ?? 'Material sin nombre',
      cantidad:
        material.getAttribute('cantidad') ??
        String(material.getElementsByTagName('trabajo').length),
      xml: serializer.serializeToString(material),
    }));

    return {
      resumen: this.extraerResumen(documento),
      materiales,
      totalMateriales: materiales.length,
    };
  }

  private procesarInformeOrdenes(xml: string): InformeProcesado & { clientes: ClienteDetalle[] } {
    const documento = this.parsearXml(xml);

    if (!documento) {
      return {
        resumen: this.resumenVacio(),
        clientes: [],
        totalClientes: 0,
      };
    }

    const ordenes = Array.from(documento.getElementsByTagName('orden'));
    const clientesAgrupados = new Map<string, Element[]>();

    ordenes.forEach((orden) => {
      const nombre =
        orden.getElementsByTagName('cliente')[0]?.textContent?.trim() || 'Cliente sin nombre';
      const acumuladas = clientesAgrupados.get(nombre) ?? [];
      acumuladas.push(orden);
      clientesAgrupados.set(nombre, acumuladas);
    });

    const serializer = new XMLSerializer();
    const clientes = Array.from(clientesAgrupados.entries()).map(([nombre, ordenesCliente]) => ({
      nombre,
      cantidad: String(ordenesCliente.length),
      xml: this.construirFragmentoCliente(nombre, ordenesCliente, serializer),
    }));

    return {
      resumen: this.extraerResumen(documento),
      clientes,
      totalClientes: clientes.length,
    };
  }

  private construirFragmentoCliente(
    nombre: string,
    ordenes: Element[],
    serializer: XMLSerializer,
  ): string {
    const ordenesSerializadas = ordenes
      .map((orden) => serializer.serializeToString(orden))
      .join('\n');

    return `<cliente nombre="${this.escaparXml(nombre)}" cantidad="${ordenes.length}">\n${ordenesSerializadas}\n</cliente>`;
  }

  private extraerResumen(documento: Document): ResumenInforme {
    const leer = (tag: string, fallback = '0') =>
      documento.getElementsByTagName(tag)[0]?.textContent?.trim() || fallback;

    return {
      totalOrdenes: leer('total_ordenes'),
      terminadas: leer('ordenes_terminadas'),
      pendientes: leer('ordenes_pendientes'),
      valorTotal: leer('valor_total_cop'),
    };
  }

  private parsearXml(xml: string): Document | null {
    const parser = new DOMParser();
    const documento = parser.parseFromString(xml, 'application/xml');

    return documento.querySelector('parsererror') ? null : documento;
  }

  private resumenVacio(): ResumenInforme {
    return {
      totalOrdenes: '0',
      terminadas: '0',
      pendientes: '0',
      valorTotal: '0',
    };
  }

  private escaparXml(valor: string): string {
    return valor
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
