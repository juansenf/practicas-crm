import { z } from "zod";
import { nombreSchema } from "@/modules/auth/schema";

const vacioComoUndefined = (valor: unknown) => (valor === "" || valor === null ? undefined : valor);

/** Convierte "YYYY-MM-DD" (input date) en un Date a medianoche UTC. */
const fechaSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato AAAA-MM-DD.")
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`))
  .refine((fecha) => !Number.isNaN(fecha.getTime()), "La fecha no es válida.");

export const estadosProyecto = [
  "PLANIFICADO",
  "EN_CURSO",
  "PAUSADO",
  "FINALIZADO",
  "CANCELADO",
] as const;

export const crearProyectoSchema = z
  .object({
    nombre: nombreSchema,
    descripcion: z.preprocess(
      vacioComoUndefined,
      z.string().trim().max(1000, "La descripción no puede superar los 1000 caracteres.").optional(),
    ),
    clienteId: z.string().trim().min(1, "Seleccioná un cliente."),
    presupuesto: z.preprocess(
      vacioComoUndefined,
      z.coerce
        .number()
        .min(0, "El presupuesto no puede ser negativo.")
        .max(999_999_999, "El presupuesto excede el máximo permitido.")
        .optional(),
    ),
    fechaInicio: fechaSchema,
    fechaFinEstimada: z.preprocess(vacioComoUndefined, fechaSchema.optional()),
  })
  .refine(
    (datos) => !datos.fechaFinEstimada || datos.fechaFinEstimada >= datos.fechaInicio,
    { message: "La fecha de fin no puede ser anterior a la fecha de inicio.", path: ["fechaFinEstimada"] },
  );

export const actualizarProyectoSchema = z
  .object({
    nombre: nombreSchema.optional(),
    descripcion: z.preprocess(
      vacioComoUndefined,
      z.string().trim().max(1000, "La descripción no puede superar los 1000 caracteres.").optional(),
    ),
    presupuesto: z.preprocess(
      vacioComoUndefined,
      z.coerce.number().min(0, "El presupuesto no puede ser negativo.").max(999_999_999).optional(),
    ),
    fechaInicio: fechaSchema.optional(),
    fechaFinEstimada: z.preprocess(vacioComoUndefined, fechaSchema.optional()),
  })
  .refine((datos) => Object.keys(datos).length > 0, "Enviá al menos un campo para actualizar.");

export const cambiarEstadoProyectoSchema = z.object({
  estado: z.enum(estadosProyecto, { error: "Seleccioná un estado válido." }),
});

export const filtroProyectosSchema = z.object({
  q: z.preprocess(vacioComoUndefined, z.string().trim().max(100).optional()),
  estado: z.preprocess(vacioComoUndefined, z.enum(estadosProyecto).optional()),
  clienteId: z.preprocess(vacioComoUndefined, z.string().trim().optional()),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
});

export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>;
export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>;
export type FiltroProyectosInput = z.infer<typeof filtroProyectosSchema>;
