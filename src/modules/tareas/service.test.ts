import { describe, expect, it } from "vitest";
import { crearTareaService, transicionTareaPermitida } from "./service";
import { crearTareaRepositorioMemoria } from "@/test/fakes";
import type { Actor } from "@/modules/auth/policy";
import type { Tarea } from "./types";

const admin: Actor = { id: "u-admin", nombre: "Admin", rol: "ADMIN", clienteId: null };
const operador: Actor = { id: "u-op", nombre: "Operador", rol: "OPERADOR", clienteId: null };
const cliente: Actor = { id: "u-cli", nombre: "Cliente", rol: "CLIENTE", clienteId: "cliente-1" };

const proyectoActivo = {
  id: "p-1",
  nombre: "Sitio institucional",
  clienteId: "cliente-1",
  estado: "EN_CURSO",
  activo: true,
};

const tareaBase: Tarea = {
  id: "t-1",
  titulo: "Maquetar home",
  descripcion: null,
  estado: "PENDIENTE",
  prioridad: "MEDIA",
  fechaLimite: null,
  horasEstimadas: 8,
  activo: true,
  proyectoId: "p-1",
  responsableId: "u-op",
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  proyecto: proyectoActivo,
  responsable: { id: "u-op", nombre: "Operador" },
};

function repositorioCon(tareas: Tarea[] = [], opciones = {}) {
  return crearTareaRepositorioMemoria(tareas, {
    proyectos: { "p-1": proyectoActivo },
    usuariosActivos: ["u-op", "u-admin"],
    ...opciones,
  });
}

describe("reglas de estado de tareas", () => {
  it("permite las transiciones definidas", () => {
    expect(transicionTareaPermitida("PENDIENTE", "EN_PROGRESO")).toBe(true);
    expect(transicionTareaPermitida("EN_PROGRESO", "COMPLETADA")).toBe(true);
    expect(transicionTareaPermitida("BLOQUEADA", "EN_PROGRESO")).toBe(true);
  });

  it("bloquea transiciones inválidas", () => {
    expect(transicionTareaPermitida("COMPLETADA", "PENDIENTE")).toBe(false);
    expect(transicionTareaPermitida("BLOQUEADA", "COMPLETADA")).toBe(false);
  });
});

describe("servicio de tareas", () => {
  it("crea una tarea en un proyecto vigente", async () => {
    const { repo } = repositorioCon();
    const servicio = crearTareaService(repo);

    const creada = await servicio.crear(admin, {
      titulo: "Nueva tarea",
      proyectoId: "p-1",
      prioridad: "ALTA",
    });

    expect(creada.estado).toBe("PENDIENTE");
    expect(creada.proyectoId).toBe("p-1");
    expect(creada.prioridad).toBe("ALTA");
  });

  it("no crea tareas en un proyecto finalizado", async () => {
    const { repo } = crearTareaRepositorioMemoria([], {
      proyectos: { "p-1": { ...proyectoActivo, estado: "FINALIZADO" } },
    });
    const servicio = crearTareaService(repo);

    await expect(
      servicio.crear(admin, { titulo: "Tarea tardía", proyectoId: "p-1", prioridad: "MEDIA" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("no crea tareas en un proyecto inexistente o dado de baja", async () => {
    const { repo } = crearTareaRepositorioMemoria([], { proyectos: {} });
    const servicio = crearTareaService(repo);

    await expect(
      servicio.crear(admin, { titulo: "Tarea huérfana", proyectoId: "p-9", prioridad: "MEDIA" }),
    ).rejects.toMatchObject({ status: 409, details: { proyectoId: expect.any(Array) } });
  });

  it("valida que el responsable sea un usuario interno activo", async () => {
    const { repo } = repositorioCon();
    const servicio = crearTareaService(repo);

    await expect(
      servicio.crear(admin, {
        titulo: "Tarea asignada",
        proyectoId: "p-1",
        prioridad: "MEDIA",
        responsableId: "u-inexistente",
      }),
    ).rejects.toMatchObject({ status: 409, details: { responsableId: expect.any(Array) } });
  });

  it("rechaza transiciones de estado no permitidas", async () => {
    const { repo } = repositorioCon([{ ...tareaBase, estado: "COMPLETADA" }]);
    const servicio = crearTareaService(repo);

    await expect(servicio.cambiarEstado(admin, "t-1", "PENDIENTE")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("no modifica tareas de un proyecto cancelado", async () => {
    const cancelado = { ...proyectoActivo, estado: "CANCELADO" };
    const { repo } = repositorioCon([{ ...tareaBase, proyecto: cancelado }]);
    const servicio = crearTareaService(repo);

    await expect(servicio.cambiarEstado(admin, "t-1", "EN_PROGRESO")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("impide que un CLIENTE cree tareas", async () => {
    const { repo } = repositorioCon();
    const servicio = crearTareaService(repo);

    await expect(
      servicio.crear(cliente, { titulo: "Intento", proyectoId: "p-1", prioridad: "MEDIA" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("restringe el listado del CLIENTE a las tareas de su empresa", async () => {
    const { repo } = repositorioCon([
      tareaBase,
      {
        ...tareaBase,
        id: "t-2",
        proyectoId: "p-2",
        proyecto: { ...proyectoActivo, id: "p-2", clienteId: "cliente-2" },
      },
    ]);
    const servicio = crearTareaService(repo);

    const resultado = await servicio.listar(cliente, { pagina: 1, porPagina: 10 });

    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].id).toBe("t-1");
  });

  it("aplica baja lógica de la tarea", async () => {
    const { repo } = repositorioCon([tareaBase]);
    const servicio = crearTareaService(repo);

    const desactivada = await servicio.desactivar(operador, "t-1");

    expect(desactivada.activo).toBe(false);
  });
});
