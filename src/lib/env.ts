import { z } from "zod";

/**
 * Validación de variables de entorno al estilo "fail fast":
 * si falta una variable crítica, la aplicación no arranca en lugar de
 * fallar silenciosamente en tiempo de ejecución.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria."),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET debe tener al menos 32 caracteres."),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 8),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Configuración de entorno inválida. Revisá tu archivo .env (ver .env.example):\n${detalle}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Solo para tests: fuerza a releer las variables de entorno en el próximo acceso. */
export function resetEnvCache(): void {
  cached = null;
}
