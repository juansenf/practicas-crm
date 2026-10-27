import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hash de contraseñas", () => {
  it("genera un hash bcrypt distinto al texto plano", async () => {
    const hash = await hashPassword("Demo12345!");

    expect(hash).not.toBe("Demo12345!");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("usa un salt aleatorio (dos hashes del mismo texto difieren)", async () => {
    const [a, b] = await Promise.all([hashPassword("Demo12345!"), hashPassword("Demo12345!")]);

    expect(a).not.toBe(b);
  });

  it("valida la contraseña correcta", async () => {
    const hash = await hashPassword("Demo12345!");

    await expect(verifyPassword("Demo12345!", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("Demo12345!");

    await expect(verifyPassword("Demo12345?", hash)).resolves.toBe(false);
  });
});
