import { z } from "zod";

/** Email normalizado (trim + minúsculas) antes de validar el formato. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresá un email válido."));

/**
 * Política de contraseñas alineada con OWASP ASVS:
 * longitud mínima 10, sin exigir composición arbitraria pero sí variedad.
 * El límite superior evita el truncamiento silencioso de bcrypt (72 bytes).
 */
export const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .max(72, "La contraseña no puede superar los 72 caracteres.")
  .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número.");

export const nombreSchema = z
  .string()
  .trim()
  .min(2, "Ingresá al menos 2 caracteres.")
  .max(100, "El nombre no puede superar los 100 caracteres.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registroSchema = z.object({
  nombre: nombreSchema,
  empresa: nombreSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
