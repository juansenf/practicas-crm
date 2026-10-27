import { describe, expect, it } from "vitest";
import { crearClienteService } from "./service";
import { crearClienteRepositorioMemoria } from "@/test/fakes";
import type { Actor } from "@/modules/auth/policy";

const admin: Actor = { id: "u-admin", nombre: "Admin", rol: "ADMIN", clienteId: null };
const operador: Actor = { id: "u-op", nombre: "Operador", rol: "OPERADOR", clienteId: null };
const cliente: Actor = { id: "u-cli", nombre: "Cliente", rol: "CLIENTE", clienteId: "cliente-1" };

const datosValidos = {
  nombre: "Estudio Pérez",
  email: "contacto@estudioperez.com",
  cuit: "30712345678",
  telefono: "+54 11 4555-1234",
  direccion: "Av. Corrientes 1234",
  notas: "Cliente histórico",
};

describe("servicio de clientes", () => {
  it("crea un cliente con datos válidos y queda activo", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);

    const creado = await servicio.crear(admin, datosValidos);

    expect(creado.id).toBeTruthy();
    expect(creado.activo).toBe(true);
    expect(creado.email).toBe(datosValidos.email);
  });

  it("rechaza un email duplicado con error de conflicto por campo", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);

    await servicio.crear(admin, datosValidos);

    await expect(servicio.crear(operador, datosValidos)).rejects.toMatchObject({
      status: 409,
      details: { email: expect.any(Array) },
    });
  });

  it("rechaza un CUIT duplicado", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);

    await servicio.crear(admin, datosValidos);

    await expect(
      servicio.crear(admin, { ...datosValidos, email: "otro@estudio.com" }),
    ).rejects.toMatchObject({ status: 409, details: { cuit: expect.any(Array) } });
  });

  it("prohíbe listar clientes a un usuario con rol CLIENTE", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);

    await expect(servicio.listar(cliente, { pagina: 1, porPagina: 10 })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("no permite dar de baja un cliente con proyectos activos", async () => {
    const { repo } = crearClienteRepositorioMemoria([], {
      proyectosActivos: { "cliente-1": 2 },
    });
    const servicio = crearClienteService(repo);
    await repo.crear({ ...datosValidos, email: "baja@test.com", cuit: "" });

    const [existente] = await repo.listar({ pagina: 1, porPagina: 10 }).then((r) => r.items);

    await expect(servicio.desactivar(admin, existente.id)).rejects.toMatchObject({ status: 409 });
  });

  it("aplica baja lógica cuando no hay proyectos activos", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);
    const creado = await servicio.crear(admin, { ...datosValidos, cuit: "" });

    const desactivado = await servicio.desactivar(admin, creado.id);

    expect(desactivado.activo).toBe(false);
  });

  it("impide que un usuario CLIENTE acceda a la ficha de otra empresa", async () => {
    const { repo } = crearClienteRepositorioMemoria();
    const servicio = crearClienteService(repo);
    const creado = await servicio.crear(admin, { ...datosValidos, cuit: "" });

    await expect(
      servicio.obtener({ ...cliente, clienteId: "cliente-de-otra-empresa" }, creado.id),
    ).rejects.toMatchObject({ status: 403 });
  });
});
