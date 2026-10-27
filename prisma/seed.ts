/**
 * Datos de demostración.
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar registros.
 * Uso: npx prisma db seed
 *
 * Credenciales (solo para desarrollo):
 *   admin@nexo.local    / Demo12345!
 *   operador@nexo.local / Demo12345!
 *   cliente@nexo.local  / Demo12345!
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL. Copiá .env.example a .env antes de sembrar la base.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PASSWORD_DEMO = "Demo12345!";

async function main() {
  const passwordHash = await hash(PASSWORD_DEMO, 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@nexo.local" },
    update: {},
    create: {
      nombre: "Facundo Lemo",
      email: "admin@nexo.local",
      passwordHash,
      rol: "ADMIN",
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: "operador@nexo.local" },
    update: {},
    create: {
      nombre: "Valentina Arballo",
      email: "operador@nexo.local",
      passwordHash,
      rol: "OPERADOR",
    },
  });

  const clienteUno = await prisma.cliente.upsert({
    where: { email: "contacto@estudioperez.com" },
    update: {},
    create: {
      nombre: "Estudio Pérez",
      email: "contacto@estudioperez.com",
      cuit: "30712345678",
      telefono: "+54 11 4555-1234",
      direccion: "Av. Corrientes 1234, CABA",
      notas: "Cliente histórico. Facturación mensual.",
    },
  });

  const clienteDos = await prisma.cliente.upsert({
    where: { email: "hola@lorenzo.com" },
    update: {},
    create: {
      nombre: "Semillero Don Lorenzo",
      email: "hola@lorenzo.com",
      cuit: "30698765432",
      telefono: "+54 221 444-9876",
      direccion: "Ruta 11 km 12, La Plata",
    },
  });

  const clienteUsuario = await prisma.usuario.upsert({
    where: { email: "cliente@nexo.local" },
    update: {},
    create: {
      nombre: "Ana Pérez",
      email: "cliente@nexo.local",
      passwordHash,
      rol: "CLIENTE",
      clienteId: clienteUno.id,
    },
  });

  const proyectos = [
    {
      nombre: "Rediseño del sitio institucional",
      descripcion: "Nuevo sitio responsive con CMS para gestionar novedades del estudio.",
      clienteId: clienteUno.id,
      estado: "EN_CURSO" as const,
      presupuesto: 1_800_000,
      fechaInicio: new Date("2026-03-02T00:00:00.000Z"),
      fechaFinEstimada: new Date("2026-06-30T00:00:00.000Z"),
    },
    {
      nombre: "Portal de clientes",
      descripcion: "Área privada para consultar el estado de expedientes.",
      clienteId: clienteUno.id,
      estado: "PLANIFICADO" as const,
      presupuesto: 2_400_000,
      fechaInicio: new Date("2026-07-01T00:00:00.000Z"),
      fechaFinEstimada: new Date("2026-11-30T00:00:00.000Z"),
    },
    {
      nombre: "Catálogo digital de productos",
      descripcion: "Catálogo con filtros y formulario de contacto.",
      clienteId: clienteDos.id,
      estado: "EN_CURSO" as const,
      presupuesto: 950_000,
      fechaInicio: new Date("2026-04-15T00:00:00.000Z"),
      fechaFinEstimada: new Date("2026-08-15T00:00:00.000Z"),
    },
  ];

  for (const datos of proyectos) {
    const existente = await prisma.proyecto.findFirst({
      where: { nombre: datos.nombre, clienteId: datos.clienteId },
      select: { id: true },
    });

    if (!existente) {
      await prisma.proyecto.create({
        data: { ...datos, creadoPorId: operador.id },
      });
    }
  }

  const proyectoUno = await prisma.proyecto.findFirstOrThrow({
    where: { nombre: proyectos[0].nombre, clienteId: clienteUno.id },
    select: { id: true },
  });

  const tareas = [
    { titulo: "Relevar requerimientos con el cliente", estado: "COMPLETADA" as const, prioridad: "ALTA" as const, responsableId: operador.id, fechaLimite: new Date("2026-03-10T00:00:00.000Z"), horasEstimadas: 6 },
    { titulo: "Diseñar wireframes de las 5 secciones", estado: "COMPLETADA" as const, prioridad: "MEDIA" as const, responsableId: admin.id, fechaLimite: new Date("2026-03-25T00:00:00.000Z"), horasEstimadas: 12 },
    { titulo: "Implementar maquetación responsive", estado: "EN_PROGRESO" as const, prioridad: "ALTA" as const, responsableId: operador.id, fechaLimite: new Date("2026-05-15T00:00:00.000Z"), horasEstimadas: 24 },
    { titulo: "Integrar CMS de novedades", estado: "PENDIENTE" as const, prioridad: "MEDIA" as const, responsableId: null, fechaLimite: new Date("2026-06-01T00:00:00.000Z"), horasEstimadas: 16 },
  ];

  for (const tarea of tareas) {
    const existente = await prisma.tarea.findFirst({
      where: { titulo: tarea.titulo, proyectoId: proyectoUno.id },
      select: { id: true },
    });

    if (!existente) {
      await prisma.tarea.create({ data: { ...tarea, proyectoId: proyectoUno.id } });
    }
  }

  console.log("Datos de demostración cargados:");
  console.log(`  admin@nexo.local    / ${PASSWORD_DEMO}  (ADMIN)`);
  console.log(`  operador@nexo.local / ${PASSWORD_DEMO}  (OPERADOR)`);
  console.log(`  cliente@nexo.local  / ${PASSWORD_DEMO}  (CLIENTE → Estudio Pérez)`);
  console.log(`  usuarios: ${[admin, operador, clienteUsuario].length} · clientes: 2 · proyectos: ${proyectos.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
