import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";
import type { Rol } from "@/generated/prisma/enums";

const ISSUER = "practicas-crm";
const AUDIENCE = "practicas-crm-web";

export type SesionPayload = {
  sub: string;
  nombre: string;
  rol: Rol;
  clienteId: string | null;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function firmarSesion(payload: SesionPayload): Promise<string> {
  const ttl = getEnv().SESSION_TTL_SECONDS;

  return new SignJWT({
    nombre: payload.nombre,
    rol: payload.rol,
    clienteId: payload.clienteId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getSecret());
}

/** Devuelve el payload si el token es válido y no expiró; null en caso contrario. */
export async function verificarSesion(token: string): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.nombre !== "string" ||
      typeof payload.rol !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      nombre: payload.nombre,
      rol: payload.rol as Rol,
      clienteId: typeof payload.clienteId === "string" ? payload.clienteId : null,
    };
  } catch {
    return null;
  }
}
