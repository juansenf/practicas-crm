import { describe, expect, it } from "vitest";
import { crearProyectoService, transicionPermitida } from "./service";
import { crearProyectoRepositorioMemoria } from "@/test/fakes";
import type { Actor } from "@/modules/auth/policy";
import type { ProyectoConCliente } from "./types";

const admin: Actor = { id: "u-admin", nombre: "Admin", rol: "ADMIN", clienteId: null };
const cliente: Actor = { id: "u-cli", nombre: "Cliente", rol: "CLIENTE", clienteId: "cliente-1" };

const proyectoBase: ProyectoConCliente = {
  id: "p-1",
  nombre: "Sitio institucional",
  descripcion: null,
  estado: "EN_CURSO",
  presupuesto: 1_000_000,
  fechaInicio: new Date("2026-01-01"),
  fechaFinEstimada: null,
  activo: true,
  clienteId: "cliente-1",
  creadoPorId: "u-admin",
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  cliente: { id: "cliente-1", nombre: "Estudio Pérez" },
};

const datosNuevos = {
  nombre: "Nuevo proyecto",
  clienteId: "cliente-1",
  fechaInicio: new Date("2026-02-01"),
};

describe("reglas de estado de proyectos", () => {
  it("permite las transiciones definidas del ciclo de vida", () => {
    expect(transicionPermitida("PLANIFICADO", "EN_CURSO")).toBe(true);
    expect(transicionPermitida("EN_CURSO", "FINALIZADO")).toBe(true);
    expect(transicionPermitida("PAUSADO", "EN_CURSO")).toBe(true);
  });

  it("bloquea transiciones inválidas y estados terminales", () => {
    expect(transicionPermitida("FINALIZADO", "EN_CURSO")).toBe(false);
    expect(transicionPermitida("CANCELADO", "PLANIFICADO")).toBe(false);
    expect(transicionPermitida("PLANIFICADO", "FINALIZADO")).toBe(false);
  });
});

describe("servicio de proyectos", () => {
  it("no crea proyectos para un cliente dado de baja", async () => {
    const { repo } = crearProyectoRepositorioMemoria([], { clientesActivos: [] });
    const servicio = crearProyectoService(repo);

    await expect(servicio.crear(admin, datosNuevos)).rejects.toMatchObject({
      status: 409,
      details: { clienteId: expect.any(Array) },
    });
  });

  it("crea el proyecto con el actor como creador", async () => {
    const { repo } = crearProyectoRepositorioMemoria();
    const servicio = crearProyectoService(repo);

    const creado = await servicio.crear(admin, datosNuevos);

    expect(creado.creadoPorId).toBe(admin.id);
    expect(creado.estado).toBe("PLANIFICADO");
  });

  it("rechaza un cambio de estado no permitido", async () => {
    const { repo } = crearProyectoRepositorioMemoria([{ ...proyectoBase, estado: "FINALIZADO" }]);
    const servicio = crearProyectoService(repo);

    await expect(servicio.cambiarEstado(admin, "p-1", "EN_CURSO")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("no permite editar un proyecto finalizado", async () => {
    const { repo } = crearProyectoRepositorioMemoria([{ ...proyectoBase, estado: "FINALIZADO" }]);
    const servicio = crearProyectoService(repo);

    await expect(servicio.actualizar(admin, "p-1", { nombre: "Otro nombre" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("fuerza el filtro por cliente cuando el actor tiene rol CLIENTE", async () => {
    const { repo } = crearProyectoRepositorioMemoria([
      proyectoBase,
      { ...proyectoBase, id: "p-2", clienteId: "cliente-2" },
    ]);
    const servicio = crearProyectoService(repo);

    const resultado = await servicio.listar(cliente, { pagina: 1, porPagina: 10 });

    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].clienteId).toBe("cliente-1");
  });

  it("no da de baja un proyecto con tareas en progreso", async () => {
    const { repo } = crearProyectoRepositorioMemoria([proyectoBase], {
      tareasEnProgreso: { "p-1": 3 },
    });
    const servicio = crearProyectoService(repo);

    await expect(servicio.desactivar(admin, "p-1")).rejects.toMatchObject({ status: 409 });
  });
});
