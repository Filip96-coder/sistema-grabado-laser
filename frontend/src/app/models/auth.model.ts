export interface SessionInfo {
  username: string;
  role: 'admin';
}

export interface LoginResponse {
  token: string;
  session: SessionInfo;
  meta?: {
    usingFallbackCredentials?: boolean;
  };
}

export interface AdminResumenResponse {
  session: SessionInfo;
  metrics: {
    total_ordenes: number;
    ordenes_terminadas: number;
    ordenes_pendientes: number;
    valor_total_cop: number;
    clientes_activos: number;
    materiales_activos: number;
  };
  latest_orders: Array<{
    id: string;
    cliente: string;
    objeto: string;
    material: string;
    estado: 'Pendiente' | 'Terminado';
    precio_cop: number;
  }>;
}
