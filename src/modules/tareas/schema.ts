import { z } from "zod";

const vacioComoUndefined = (valor: unknown) => (valor === "" || valor === null ? undefined : valor);

const fechaSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato AAAA-MM-DD.")
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`))
  .refine((fecha) => !Number.isNaN(fecha.getTime()), "La fecha no es válida.");

export const estadosTarea = ["PENDIENTE", "EN_PROGRESO", "BLOQUEADA", "COMPLETADA"] as const;
export const prioridades = ["BAJA", "MEDIA", "ALTA"] as const;

const tituloSchema = z
  .string()
  .trim()
  .min(3, "El título debe tener al menos 3 caracteres.")
  .max(150, "El título no puede superar los 150 caracteres.");

export const crearTareaSchema = z.object({
  titulo: tituloSchema,
  descripcion: z.preprocess(
    vacioComoUndefined,
    z.string().trim().max(1000, "La descripción no puede superar los 1000 caracteres.").optional(),
  ),
  proyectoId: z.string().trim().min(1, "Seleccioná un proyecto."),
  responsableId: z.preprocess(vacioComoUndefined, z.string().trim().optional()),
  prioridad: z.enum(prioridades).default("MEDIA"),
  fechaLimite: z.preprocess(vacioComoUndefined, fechaSchema.optional()),
  horasEstimadas: z.preprocess(
    vacioComoUndefined,
    z.coerce
      .number()
      .min(0, "Las horas no pueden ser negativas.")
      .max(999, "Las horas estimadas no pueden superar 999.")
      .optional(),
  ),
});

export const actualizarTareaSchema = crearTareaSchema
  .omit({ proyectoId: true })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, "Enviá al menos un campo para actualizar.");

export const cambiarEstadoTareaSchema = z.object({
  estado: z.enum(estadosTarea, { error: "Seleccioná un estado válido." }),
});

export const filtroTareasSchema = z.object({
  q: z.preprocess(vacioComoUndefined, z.string().trim().max(100).optional()),
  estado: z.preprocess(vacioComoUndefined, z.enum(estadosTarea).optional()),
  prioridad: z.preprocess(vacioComoUndefined, z.enum(prioridades).optional()),
  proyectoId: z.preprocess(vacioComoUndefined, z.string().trim().optional()),
  responsableId: z.preprocess(vacioComoUndefined, z.string().trim().optional()),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
});

export type CrearTareaInput = z.infer<typeof crearTareaSchema>;
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;
export type FiltroTareasInput = z.infer<typeof filtroTareasSchema>;
