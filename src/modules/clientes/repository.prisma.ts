import { prisma } from "@/lib/db";
import type { Cliente, ClienteRepository, DatosCliente, FiltroClientes } from "./types";

const SELECT_CLIENTE = {
  id: true,
  nombre: true,
  cuit: true,
  email: true,
  telefono: true,
  direccion: true,
  notas: true,
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

export const clienteRepository: ClienteRepository = {
  async listar(filtro: FiltroClientes) {
    const where = {
      ...(filtro.activo !== undefined ? { activo: filtro.activo } : {}),
      ...(filtro.q
        ? {
            OR: [
              { nombre: { contains: filtro.q, mode: "insensitive" as const } },
              { email: { contains: filtro.q, mode: "insensitive" as const } },
              { cuit: { contains: filtro.q } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        select: SELECT_CLIENTE,
        orderBy: { nombre: "asc" },
        skip: (filtro.pagina - 1) * filtro.porPagina,
        take: filtro.porPagina,
      }),
      prisma.cliente.count({ where }),
    ]);

    return { items, total };
  },

  buscarPorId(id: string): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { id }, select: SELECT_CLIENTE });
  },

  buscarPorEmail(email: string): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { email }, select: SELECT_CLIENTE });
  },

  buscarPorCuit(cuit: string): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { cuit }, select: SELECT_CLIENTE });
  },

  contarProyectosActivos(clienteId: string): Promise<number> {
    return prisma.proyecto.count({
      where: {
        clienteId,
        activo: true,
        estado: { in: ["PLANIFICADO", "EN_CURSO", "PAUSADO"] },
      },
    });
  },

  crear(datos: DatosCliente): Promise<Cliente> {
    return prisma.cliente.create({ data: datos, select: SELECT_CLIENTE });
  },

  actualizar(id: string, datos: Partial<DatosCliente>): Promise<Cliente> {
    return prisma.cliente.update({ where: { id }, data: datos, select: SELECT_CLIENTE });
  },

  desactivar(id: string): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id },
      data: { activo: false, eliminadoEn: new Date() },
      select: SELECT_CLIENTE,
    });
  },

  reactivar(id: string): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id },
      data: { activo: true, eliminadoEn: null },
      select: SELECT_CLIENTE,
    });
  },
};
