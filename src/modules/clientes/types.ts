export type Cliente = {
  id: string;
  nombre: string;
  cuit: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type DatosCliente = {
  nombre: string;
  cuit: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
};

export type FiltroClientes = {
  q?: string;
  activo?: boolean;
  pagina: number;
  porPagina: number;
};

export type Paginado<T> = {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

/** Puerto de persistencia del módulo de clientes. */
export interface ClienteRepository {
  listar(filtro: FiltroClientes): Promise<{ items: Cliente[]; total: number }>;
  buscarPorId(id: string): Promise<Cliente | null>;
  buscarPorEmail(email: string): Promise<Cliente | null>;
  buscarPorCuit(cuit: string): Promise<Cliente | null>;
  contarProyectosActivos(clienteId: string): Promise<number>;
  crear(datos: DatosCliente): Promise<Cliente>;
  actualizar(id: string, datos: Partial<DatosCliente>): Promise<Cliente>;
  desactivar(id: string): Promise<Cliente>;
  reactivar(id: string): Promise<Cliente>;
}
