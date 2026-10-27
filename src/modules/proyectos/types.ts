import type { EstadoProyecto } from "@/generated/prisma/enums";

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  presupuesto: number | null;
  fechaInicio: Date;
  fechaFinEstimada: Date | null;
  activo: boolean;
  clienteId: string;
  creadoPorId: string;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type ProyectoConCliente = Proyecto & {
  cliente: { id: string; nombre: string };
};

export type DatosProyecto = {
  nombre: string;
  descripcion: string | null;
  presupuesto: number | null;
  fechaInicio: Date;
  fechaFinEstimada: Date | null;
  clienteId: string;
  creadoPorId: string;
};

export type FiltroProyectos = {
  q?: string;
  estado?: EstadoProyecto;
  clienteId?: string;
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

export interface ProyectoRepository {
  listar(filtro: FiltroProyectos): Promise<{ items: ProyectoConCliente[]; total: number }>;
  buscarPorId(id: string): Promise<ProyectoConCliente | null>;
  clienteActivo(clienteId: string): Promise<boolean>;
  crear(datos: DatosProyecto): Promise<ProyectoConCliente>;
  actualizar(id: string, datos: Partial<Omit<DatosProyecto, "creadoPorId" | "clienteId">>): Promise<ProyectoConCliente>;
  cambiarEstado(id: string, estado: EstadoProyecto): Promise<ProyectoConCliente>;
  desactivar(id: string): Promise<ProyectoConCliente>;
  contarTareasEnProgreso(proyectoId: string): Promise<number>;
}
