import type { EstadoTarea, Prioridad } from "@/generated/prisma/enums";

export type ProyectoResumen = {
  id: string;
  nombre: string;
  clienteId: string;
  estado: string;
  activo: boolean;
};

export type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: Prioridad;
  fechaLimite: Date | null;
  horasEstimadas: number | null;
  activo: boolean;
  proyectoId: string;
  responsableId: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  proyecto: ProyectoResumen;
  responsable: { id: string; nombre: string } | null;
};

export type DatosTarea = {
  titulo: string;
  descripcion: string | null;
  prioridad: Prioridad;
  fechaLimite: Date | null;
  horasEstimadas: number | null;
  proyectoId: string;
  responsableId: string | null;
};

export type FiltroTareas = {
  q?: string;
  estado?: EstadoTarea;
  prioridad?: Prioridad;
  proyectoId?: string;
  responsableId?: string;
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

export interface TareaRepository {
  listar(filtro: FiltroTareas): Promise<{ items: Tarea[]; total: number }>;
  buscarPorId(id: string): Promise<Tarea | null>;
  proyectoDisponible(proyectoId: string): Promise<ProyectoResumen | null>;
  usuarioActivo(usuarioId: string): Promise<boolean>;
  crear(datos: DatosTarea): Promise<Tarea>;
  actualizar(
    id: string,
    datos: Partial<Omit<DatosTarea, "proyectoId">>,
  ): Promise<Tarea>;
  cambiarEstado(id: string, estado: EstadoTarea): Promise<Tarea>;
  desactivar(id: string): Promise<Tarea>;
}
