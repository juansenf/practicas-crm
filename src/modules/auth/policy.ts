import type { Rol } from "@/generated/prisma/enums";

/** Identidad mínima del usuario autenticado, usada por las reglas de autorización. */
export type Actor = {
  id: string;
  nombre: string;
  rol: Rol;
  clienteId: string | null;
};

const ROLES_INTERNOS: Rol[] = ["ADMIN", "OPERADOR"];

export function esRolInterno(actor: Actor): boolean {
  return ROLES_INTERNOS.includes(actor.rol);
}

export function esAdmin(actor: Actor): boolean {
  return actor.rol === "ADMIN";
}

/** Solo ADMIN y OPERADOR gestionan el padrón de clientes. */
export function puedeGestionarClientes(actor: Actor): boolean {
  return esRolInterno(actor);
}

/**
 * El usuario con rol CLIENTE solo puede ver su propia ficha.
 * Se compara por id de cliente para impedir acceso por IDOR.
 */
export function puedeVerCliente(actor: Actor, clienteId: string): boolean {
  return esRolInterno(actor) || actor.clienteId === clienteId;
}

export function puedeGestionarProyectos(actor: Actor): boolean {
  return esRolInterno(actor);
}

/** El cliente del portal accede únicamente a los proyectos de su empresa. */
export function puedeVerProyecto(actor: Actor, proyecto: { clienteId: string }): boolean {
  return esRolInterno(actor) || actor.clienteId === proyecto.clienteId;
}

export function puedeGestionarTareas(actor: Actor): boolean {
  return esRolInterno(actor);
}

export function puedeVerTarea(actor: Actor, proyecto: { clienteId: string }): boolean {
  return puedeVerProyecto(actor, proyecto);
}
