import { z } from "zod";
import { emailSchema, nombreSchema } from "@/modules/auth/schema";

/** Convierte "" o null en undefined: los formularios envían strings vacíos. */
const vacioComoUndefined = (valor: unknown) => (valor === "" || valor === null ? undefined : valor);

export const cuitSchema = z
  .string()
  .trim()
  .transform((valor) => valor.replace(/-/g, ""))
  .pipe(z.string().regex(/^\d{11}$/, "El CUIT debe tener 11 dígitos."));

const cuitOpcional = z.preprocess(vacioComoUndefined, cuitSchema.optional());

const telefonoOpcional = z.preprocess(
  vacioComoUndefined,
  z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono válido.")
    .max(30, "El teléfono no puede superar los 30 caracteres.")
    .regex(/^[0-9+()\s-]+$/, "El teléfono solo admite números, espacios y los signos + ( ) -.")
    .optional(),
);

const direccionOpcional = z.preprocess(
  vacioComoUndefined,
  z.string().trim().max(200, "La dirección no puede superar los 200 caracteres.").optional(),
);

const notasOpcional = z.preprocess(
  vacioComoUndefined,
  z.string().trim().max(1000, "Las notas no pueden superar los 1000 caracteres.").optional(),
);

export const crearClienteSchema = z.object({
  nombre: nombreSchema,
  email: emailSchema,
  cuit: cuitOpcional,
  telefono: telefonoOpcional,
  direccion: direccionOpcional,
  notas: notasOpcional,
});

export const actualizarClienteSchema = crearClienteSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, "Enviá al menos un campo para actualizar.");

export const filtroClientesSchema = z.object({
  q: z.preprocess(vacioComoUndefined, z.string().trim().max(100).optional()),
  activo: z.preprocess(
    vacioComoUndefined,
    z
      .enum(["true", "false"])
      .transform((valor) => valor === "true")
      .optional(),
  ),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
export type FiltroClientesInput = z.infer<typeof filtroClientesSchema>;
