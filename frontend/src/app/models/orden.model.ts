export interface ParametrosLaser {
  potencia?: number | null;
  velocidad?: number | null;
}

export interface OrdenTrabajo {
  _id?: string;
  cliente: string;
  objeto: string;
  material: string;
  parametros_laser?: ParametrosLaser;
  estado: 'Pendiente' | 'Terminado';
  precio_cop: number;
  createdAt?: string;
  updatedAt?: string;
}
