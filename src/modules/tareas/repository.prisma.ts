import { prisma } from "@/lib/db";
import type { EstadoTarea } from "@/generated/prisma/enums";
import type { FiltroTareas, ProyectoResumen, Tarea, TareaRepository } from "./types";

const SELECT_TAREA = {
  id: true,
  titulo: true,
  descripcion: true,
  estado: true,
  prioridad: true,
  fechaLimite: true,
  horasEstimadas: true,
  activo: true,
  proyectoId: true,
  responsableId: true,
  creadoEn: true,
  actualizadoEn: true,
  proyecto: {
    select: { id: true, nombre: true, clienteId: true, estado: true, activo: true },
  },
  responsable: { select: { id: true, nombre: true } },
} as const;

type TareaDb = {
  horasEstimadas: { toString(): string } | null;
} & Omit<Tarea, "horasEstimadas">;

function aDominio(tarea: TareaDb): Tarea {
  return {
    ...tarea,
    horasEstimadas: tarea.horasEstimadas === null ? null : Number(tarea.horasEstimadas.toString()),
  };
}

export const tareaRepository: TareaRepository = {
  async listar(filtro: FiltroTareas) {
    const where = {
      activo: true,
      ...(filtro.estado ? { estado: filtro.estado } : {}),
      ...(filtro.prioridad ? { prioridad: filtro.prioridad } : {}),
      ...(filtro.proyectoId ? { proyectoId: filtro.proyectoId } : {}),
      ...(filtro.responsableId ? { responsableId: filtro.responsableId } : {}),
      ...(filtro.clienteId ? { proyecto: { clienteId: filtro.clienteId } } : {}),
      ...(filtro.q
        ? {
            OR: [
              { titulo: { contains: filtro.q, mode: "insensitive" as const } },
              { descripcion: { contains: filtro.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [registros, total] = await prisma.$transaction([
      prisma.tarea.findMany({
        where,
        select: SELECT_TAREA,
        orderBy: [{ estado: "asc" }, { prioridad: "desc" }, { creadoEn: "desc" }],
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
      prisma.tarea.count({ where }),
    ]);

    return { items: registros.map(aDominio), total };
  },

  async buscarPorId(id: string) {
    const tarea = await prisma.tarea.findUnique({ where: { id }, select: SELECT_TAREA });
    return tarea ? aDominio(tarea) : null;
  },

  proyectoDisponible(proyectoId: string): Promise<ProyectoResumen | null> {
    return prisma.proyecto.findFirst({
      where: { id: proyectoId, activo: true },
      select: { id: true, nombre: true, clienteId: true, estado: true, activo: true },
    });
  },

  async usuarioActivo(usuarioId: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, activo: true, rol: { in: ["ADMIN", "OPERADOR"] } },
      select: { id: true },
    });
    return usuario !== null;
  },

  async crear(datos) {
    const tarea = await prisma.tarea.create({ data: datos, select: SELECT_TAREA });
    return aDominio(tarea);
  },

  async actualizar(id, datos) {
    const tarea = await prisma.tarea.update({ where: { id }, data: datos, select: SELECT_TAREA });
    return aDominio(tarea);
  },

  async cambiarEstado(id: string, estado: EstadoTarea) {
    const tarea = await prisma.tarea.update({
      where: { id },
      data: { estado },
      select: SELECT_TAREA,
    });
    return aDominio(tarea);
  },

  async desactivar(id: string) {
    const tarea = await prisma.tarea.update({
      where: { id },
      data: { activo: false, eliminadoEn: new Date() },
      select: SELECT_TAREA,
    });
    return aDominio(tarea);
  },
};
