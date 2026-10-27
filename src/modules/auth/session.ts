import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { firmarSesion, verificarSesion, type SesionPayload } from "./jwt";
import type { Actor } from "./policy";
import { COOKIE_SESION } from "@/lib/constants";

export { COOKIE_SESION };

/**
 * La sesión se guarda en una cookie HttpOnly firmada (JWT HS256).
 * El token nunca es accesible desde JavaScript del navegador, lo que reduce
 * el impacto de un XSS sobre la sesión.
 */
export async function iniciarSesionCookie(payload: SesionPayload): Promise<void> {
  const { SESSION_TTL_SECONDS, NODE_ENV } = getEnv();
  const token = await firmarSesion(payload);

  (await cookies()).set({
    name: COOKIE_SESION,
    value: token,
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function cerrarSesionCookie(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
}

/**
 * Usuario autenticado de la petición actual.
 * Se memoiza por request (React cache) y se revalida contra la base para que
 * una baja o cambio de rol tenga efecto inmediato, sin esperar al vencimiento
 * del token.
 */
export const obtenerActor = cache(async (): Promise<Actor | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;

  const sesion = await verificarSesion(token);
  if (!sesion) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
    select: { id: true, nombre: true, rol: true, clienteId: true, activo: true },
  });

  if (!usuario?.activo) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    clienteId: usuario.clienteId,
  };
});
