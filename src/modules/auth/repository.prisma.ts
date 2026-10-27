import { prisma } from "@/lib/db";
import type { AuthRepository, NuevoClienteConUsuario, UsuarioAuth } from "./types";

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  passwordHash: true,
  rol: true,
  activo: true,
  clienteId: true,
} as const;

export const authRepository: AuthRepository = {
  buscarPorEmail(email: string): Promise<UsuarioAuth | null> {
    return prisma.usuario.findUnique({ where: { email }, select: SELECT_USUARIO });
  },

  crearClienteConUsuario(datos: NuevoClienteConUsuario): Promise<UsuarioAuth> {
    return prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombre: datos.empresa,
          email: datos.email,
        },
      });

      return tx.usuario.create({
        data: {
          nombre: datos.nombre,
          email: datos.email,
          passwordHash: datos.passwordHash,
          rol: "CLIENTE",
          clienteId: cliente.id,
        },
        select: SELECT_USUARIO,
      });
    });
  },
};
