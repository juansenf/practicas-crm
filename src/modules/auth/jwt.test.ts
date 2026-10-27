import { describe, expect, it } from "vitest";
import { firmarSesion, verificarSesion } from "./jwt";
import { resetEnvCache } from "@/lib/env";

const payload = {
  sub: "usuario-1",
  nombre: "Ana Pérez",
  rol: "ADMIN" as const,
  clienteId: null,
};

describe("sesión JWT", () => {
  it("firma y verifica un token conservando el payload", async () => {
    const token = await firmarSesion(payload);
    const verificado = await verificarSesion(token);

    expect(verificado).toMatchObject(payload);
  });

  it("devuelve null para un token con formato inválido", async () => {
    await expect(verificarSesion("esto-no-es-un-jwt")).resolves.toBeNull();
  });

  it("devuelve null si el token fue manipulado", async () => {
    const token = await firmarSesion(payload);
    const manipulado = `${token.slice(0, -3)}abc`;

    await expect(verificarSesion(manipulado)).resolves.toBeNull();
  });

  it("devuelve null si el token fue firmado con otro secreto", async () => {
    const original = process.env.AUTH_SECRET;
    const token = await firmarSesion(payload);
    process.env.AUTH_SECRET = "otro-secreto-completamente-distinto-de-32-bytes";
    resetEnvCache();

    try {
      await expect(verificarSesion(token)).resolves.toBeNull();
    } finally {
      process.env.AUTH_SECRET = original;
      resetEnvCache();
    }
  });
});
