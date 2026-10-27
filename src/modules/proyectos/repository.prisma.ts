import { prisma } from "@/lib/db";
import type { EstadoProyecto } from "@/generated/prisma/enums";
import type {
  DatosProyecto,
  FiltroProyectos,
  ProyectoConCliente,
  ProyectoRepository,
} from "./types";

const SELECT_PROYECTO = {
  id: true,
  nombre: true,
  descripcion: true,
  estado: true,
  presupuesto: true,
  fechaInicio: true,
  fechaFinEstimada: true,
  activo: true,
  clienteId: true,
  creadoPorId: true,
  creadoEn: true,
  actualizadoEn: true,
  cliente: { select: { id: true, nombre: true } },
} as const;

type ProyectoDb = {
  presupuesto: { toString(): string } | null;
} & Omit<ProyectoConCliente, "presupuesto">;

/** Prisma devuelve Decimal; la capa de dominio trabaja con number. */
function aDominio(proyecto: ProyectoDb): ProyectoConCliente {
  return {
    ...proyecto,
    presupuesto: proyecto.presupuesto === null ? null : Number(proyecto.presupuesto.toString()),
  };
}

export const proyectoRepository: ProyectoRepository = {
  async listar(filtro: FiltroProyectos) {
    const where = {
      activo: true,
      ...(filtro.estado ? { estado: filtro.estado } : {}),
      ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
      ...(filtro.q
        ? {
            OR: [
              { nombre: { contains: filtro.q, mode: "insensitive" as const } },
              { cliente: { nombre: { contains: filtro.q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [registros, total] = await prisma.$transaction([
      prisma.proyecto.findMany({
        where,
        select: SELECT_PROYECTO,
        orderBy: [{ estado: "asc" }, { creadoEn: "desc" }],
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
      prisma.proyecto.count({ where }),
    ]);

    return { items: registros.map(aDominio), total };
  },

  async buscarPorId(id: string) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      select: SELECT_PROYECTO,
    });
    return proyecto ? aDominio(proyecto) : null;
  },

  async clienteActivo(clienteId: string) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, activo: true },
      select: { id: true },
    });
    return cliente !== null;
  },

  async crear(datos: DatosProyecto) {
    const proyecto = await prisma.proyecto.create({ data: datos, select: SELECT_PROYECTO });
    return aDominio(proyecto);
  },

  async actualizar(id, datos) {
    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: datos,
      select: SELECT_PROYECTO,
    });
    return aDominio(proyecto);
  },

  async cambiarEstado(id: string, estado: EstadoProyecto) {
    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: { estado },
      select: SELECT_PROYECTO,
    });
    return aDominio(proyecto);
  },

  async desactivar(id: string) {
    const proyecto = await prisma.$transaction(async (tx) => {
      await tx.tarea.updateMany({
        where: { proyectoId: id, activo: true },
        data: { activo: false, eliminadoEn: new Date() },
      });

      return tx.proyecto.update({
        where: { id },
        data: { activo: false, eliminadoEn: new Date() },
        select: SELECT_PROYECTO,
      });
    });

    return aDominio(proyecto);
  },

  contarTareasEnProgreso(proyectoId: string) {
    return prisma.tarea.count({
      where: { proyectoId, activo: true, estado: "EN_PROGRESO" },
    });
  },
};
