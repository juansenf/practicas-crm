import "server-only";
import { prisma } from "@/lib/db";

export type UsuarioInterno = { id: string; nombre: string; rol: string };

/** Usuarios activos que pueden ser responsables de una tarea. */
export async function listarUsuariosInternos(): Promise<UsuarioInterno[]> {
  return prisma.usuario.findMany({
    where: { activo: true, rol: { in: ["ADMIN", "OPERADOR"] } },
    select: { id: true, nombre: true, rol: true },
    orderBy: { nombre: "asc" },
  });
}
