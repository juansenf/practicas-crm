import type { Rol } from "@/generated/prisma/enums";

export type UsuarioAuth = {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  activo: boolean;
  clienteId: string | null;
};

export type NuevoClienteConUsuario = {
  empresa: string;
  nombre: string;
  email: string;
  passwordHash: string;
};

/** Puerto de persistencia del módulo de autenticación (permite testear con dobles). */
export interface AuthRepository {
  buscarPorEmail(email: string): Promise<UsuarioAuth | null>;
  crearClienteConUsuario(datos: NuevoClienteConUsuario): Promise<UsuarioAuth>;
}
