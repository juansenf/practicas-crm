import { describe, expect, it } from "vitest";
import { crearAuthService } from "./service";
import { crearAuthRepositorioMemoria } from "@/test/fakes";
import { hashPassword } from "./password";
import { crearLimitador } from "@/lib/rate-limit";

const PASSWORD = "Demo12345!";

async function repositorioConUsuario() {
  const passwordHash = await hashPassword(PASSWORD);
  return crearAuthRepositorioMemoria([
    {
      id: "usuario-1",
      nombre: "Ana Pérez",
      email: "ana@test.com",
      passwordHash,
      rol: "CLIENTE",
      activo: true,
      clienteId: "cliente-1",
    },
  ]);
}

describe("servicio de autenticación", () => {
  it("inicia sesión con credenciales válidas", async () => {
    const { repo } = await repositorioConUsuario();
    const servicio = crearAuthService(repo);

    const actor = await servicio.iniciarSesion({ email: "ana@test.com", password: PASSWORD });

    expect(actor).toMatchObject({ id: "usuario-1", rol: "CLIENTE", clienteId: "cliente-1" });
  });

  it("rechaza una contraseña incorrecta con un mensaje genérico", async () => {
    const { repo } = await repositorioConUsuario();
    const servicio = crearAuthService(repo);

    await expect(
      servicio.iniciarSesion({ email: "ana@test.com", password: "Incorrecta123!" }),
    ).rejects.toMatchObject({ status: 401, message: "Email o contraseña incorrectos." });
  });

  it("no revela si el email existe (mismo error para usuario inexistente)", async () => {
    const { repo } = await repositorioConUsuario();
    const servicio = crearAuthService(repo);

    await expect(
      servicio.iniciarSesion({ email: "nadie@test.com", password: PASSWORD }),
    ).rejects.toMatchObject({ status: 401, message: "Email o contraseña incorrectos." });
  });

  it("bloquea una cuenta deshabilitada", async () => {
    const passwordHash = await hashPassword(PASSWORD);
    const { repo } = crearAuthRepositorioMemoria([
      {
        id: "usuario-2",
        nombre: "Baja",
        email: "baja@test.com",
        passwordHash,
        rol: "OPERADOR",
        activo: false,
        clienteId: null,
      },
    ]);
    const servicio = crearAuthService(repo);

    await expect(
      servicio.iniciarSesion({ email: "baja@test.com", password: PASSWORD }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("corta los intentos tras superar el límite configurado", async () => {
    const { repo } = await repositorioConUsuario();
    const limitador = crearLimitador({ max: 2, ventanaMs: 60_000 });
    const servicio = crearAuthService(repo, { limitador });

    await expect(
      servicio.iniciarSesion({ email: "ana@test.com", password: "mal-1" }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      servicio.iniciarSesion({ email: "ana@test.com", password: "mal-2" }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      servicio.iniciarSesion({ email: "ana@test.com", password: PASSWORD }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("registra un cliente nuevo con rol CLIENTE", async () => {
    const { repo } = crearAuthRepositorioMemoria();
    const servicio = crearAuthService(repo);

    const actor = await servicio.registrar({
      nombre: "Juan Gómez",
      empresa: "Gómez SRL",
      email: "juan@test.com",
      password: PASSWORD,
    });

    expect(actor.rol).toBe("CLIENTE");
    expect(actor.clienteId).toBeTruthy();

    const guardado = await repo.buscarPorEmail("juan@test.com");
    expect(guardado?.passwordHash).not.toBe(PASSWORD);
  });

  it("rechaza el registro con un email ya utilizado", async () => {
    const { repo } = crearAuthRepositorioMemoria();
    const servicio = crearAuthService(repo);

    await servicio.registrar({
      nombre: "Juan Gómez",
      empresa: "Gómez SRL",
      email: "juan@test.com",
      password: PASSWORD,
    });

    await expect(
      servicio.registrar({
        nombre: "Otro Juan",
        empresa: "Otra SRL",
        email: "juan@test.com",
        password: PASSWORD,
      }),
    ).rejects.toMatchObject({ status: 409, details: { email: expect.any(Array) } });
  });
});
