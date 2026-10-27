import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { Rol } from "@/generated/prisma/enums";
import type { Actor } from "./policy";
import { obtenerActor } from "./session";

/** Exige sesión válida. Lanza 401 si no hay usuario autenticado. */
export async function requerirActor(): Promise<Actor> {
  const actor = await obtenerActor();
  if (!actor) {
    throw new UnauthorizedError();
  }
  return actor;
}

/** Exige sesión válida y uno de los roles indicados. Lanza 403 si no alcanza. */
export async function requerirRol(...roles: Rol[]): Promise<Actor> {
  const actor = await requerirActor();
  if (!roles.includes(actor.rol)) {
    throw new ForbiddenError("No tenés permisos para realizar esta acción.");
  }
  return actor;
}
