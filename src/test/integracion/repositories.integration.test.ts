import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Pruebas de integración de la capa de persistencia.
 *
 * Se ejecutan contra un PostgreSQL real (base dedicada) para verificar lo que
 * los dobles en memoria no pueden: constraints, claves foráneas, borrado
 * lógico en transacción y mapeo de Decimal → number.
 *
 * Se omiten si no está definida TEST_DATABASE_URL, para no romper el ciclo
 * de tests unitarios en entornos sin base de datos.
 */
const testUrl = process.env.TEST_DATABASE_URL;

const suite = testUrl ? describe : describe.skip;

suite("repositorios Prisma (integración)", () => {
  let prisma: PrismaClient;
  let clienteRepository: typeof import("@/modules/clientes/repository.prisma").clienteRepository;
  let proyectoRepository: typeof import("@/modules/proyectos/repository.prisma").proyectoRepository;
  let tareaRepository: typeof import("@/modules/tareas/repository.prisma").tareaRepository;
  let usuarioId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    const env = await import("@/lib/env");
    env.resetEnvCache();

    ({ prisma } = await import("@/lib/db"));
    ({ clienteRepository } = await import("@/modules/clientes/repository.prisma"));
    ({ proyectoRepository } = await import("@/modules/proyectos/repository.prisma"));
    ({ tareaRepository } = await import("@/modules/tareas/repository.prisma"));

    // Red de seguridad: la suite vacía las tablas, así que se niega a correr
    // contra la base de desarrollo (identificada por los usuarios del seed).
    const usuarioSemilla = await prisma.usuario.findFirst({
      where: { email: { endsWith: "@nexo.local" } },
      select: { email: true },
    });
    if (usuarioSemilla) {
      throw new Error(
        "TEST_DATABASE_URL parece apuntar a la base de desarrollo " +
          `(encontré el usuario "${usuarioSemilla.email}"). ` +
          "Configurá una base o instancia dedicada para los tests.",
      );
    }

    await prisma.tarea.deleteMany();
    await prisma.proyecto.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.cliente.deleteMany();

    const usuario = await prisma.usuario.create({
      data: {
        nombre: "Usuario Integración",
        email: "integracion@test.local",
        passwordHash: "hash-de-prueba",
        rol: "ADMIN",
      },
    });
    usuarioId = usuario.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.tarea.deleteMany();
    await prisma.proyecto.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.$disconnect();
  });

  async function crearCliente(email: string) {
    return clienteRepository.crear({
      nombre: "Cliente Integración",
      email,
      cuit: null,
      telefono: null,
      direccion: null,
      notas: null,
    });
  }

  it("crea un cliente y lo recupera por email", async () => {
    const cliente = await crearCliente("cliente1@test.local");

    const encontrado = await clienteRepository.buscarPorEmail("cliente1@test.local");

    expect(encontrado?.id).toBe(cliente.id);
    expect(encontrado?.activo).toBe(true);
  });

  it("la base rechaza emails duplicados (unique constraint)", async () => {
    await crearCliente("duplicado@test.local");

    await expect(crearCliente("duplicado@test.local")).rejects.toMatchObject({ code: "P2002" });
  });

  it("persiste un proyecto con presupuesto Decimal y su relación con el cliente", async () => {
    const cliente = await crearCliente("cliente-proyecto@test.local");

    const proyecto = await proyectoRepository.crear({
      nombre: "Proyecto Integración",
      descripcion: "Verifica el mapeo de Decimal",
      presupuesto: 1234.56,
      fechaInicio: new Date("2026-01-01T00:00:00.000Z"),
      fechaFinEstimada: null,
      clienteId: cliente.id,
      creadoPorId: usuarioId,
    });

    expect(proyecto.presupuesto).toBeCloseTo(1234.56);
    expect(proyecto.cliente.nombre).toBe("Cliente Integración");
  });

  it("la FK Restrict impide borrar un cliente con proyectos", async () => {
    const cliente = await crearCliente("cliente-con-proyecto@test.local");
    await proyectoRepository.crear({
      nombre: "Proyecto con dueño",
      descripcion: null,
      presupuesto: null,
      fechaInicio: new Date("2026-01-01T00:00:00.000Z"),
      fechaFinEstimada: null,
      clienteId: cliente.id,
      creadoPorId: usuarioId,
    });

    await expect(prisma.cliente.delete({ where: { id: cliente.id } })).rejects.toMatchObject({
      code: "P2003",
    });
  });

  it("la baja de un proyecto desactiva sus tareas en la misma transacción", async () => {
    const cliente = await crearCliente("cliente-baja@test.local");
    const proyecto = await proyectoRepository.crear({
      nombre: "Proyecto a dar de baja",
      descripcion: null,
      presupuesto: null,
      fechaInicio: new Date("2026-01-01T00:00:00.000Z"),
      fechaFinEstimada: null,
      clienteId: cliente.id,
      creadoPorId: usuarioId,
    });

    await tareaRepository.crear({
      titulo: "Tarea que se desactiva",
      descripcion: null,
      prioridad: "MEDIA",
      fechaLimite: null,
      horasEstimadas: 4,
      proyectoId: proyecto.id,
      responsableId: null,
    });

    await proyectoRepository.desactivar(proyecto.id);

    const tareas = await prisma.tarea.findMany({ where: { proyectoId: proyecto.id } });
    expect(tareas).toHaveLength(1);
    expect(tareas[0].activo).toBe(false);
    expect(tareas[0].eliminadoEn).not.toBeNull();
  });

  it("excluye del listado las tareas inactivas y filtra por proyecto", async () => {
    const cliente = await crearCliente("cliente-listado@test.local");
    const proyectoA = await proyectoRepository.crear({
      nombre: "Proyecto A",
      descripcion: null,
      presupuesto: null,
      fechaInicio: new Date("2026-01-01T00:00:00.000Z"),
      fechaFinEstimada: null,
      clienteId: cliente.id,
      creadoPorId: usuarioId,
    });
    const proyectoB = await proyectoRepository.crear({
      nombre: "Proyecto B",
      descripcion: null,
      presupuesto: null,
      fechaInicio: new Date("2026-01-01T00:00:00.000Z"),
      fechaFinEstimada: null,
      clienteId: cliente.id,
      creadoPorId: usuarioId,
    });

    const tareaA = await tareaRepository.crear({
      titulo: "Tarea visible",
      descripcion: null,
      prioridad: "ALTA",
      fechaLimite: null,
      horasEstimadas: null,
      proyectoId: proyectoA.id,
      responsableId: usuarioId,
    });
    await tareaRepository.crear({
      titulo: "Tarea de otro proyecto",
      descripcion: null,
      prioridad: "BAJA",
      fechaLimite: null,
      horasEstimadas: null,
      proyectoId: proyectoB.id,
      responsableId: null,
    });
    await tareaRepository.desactivar(tareaA.id);

    const listado = await tareaRepository.listar({
      proyectoId: proyectoA.id,
      pagina: 1,
      porPagina: 10,
    });

    expect(listado.total).toBe(0);
    expect(listado.items).toHaveLength(0);
  });
});
