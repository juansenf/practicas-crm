import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { isAppError, ValidationError } from "./errors";

export type FieldErrors = Record<string, string[]>;

export type ApiErrorBody = {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: FieldErrors;
  };
};

/** Traduce los issues de Zod al formato { campo: [mensajes] } que consume el frontend. */
export function toFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): FieldErrors {
  const detalles: FieldErrors = {};
  for (const issue of error.issues) {
    const campo = issue.path.length > 0 ? issue.path.join(".") : "_general";
    (detalles[campo] ??= []).push(issue.message);
  }
  return detalles;
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonCreated<T>(data: T): NextResponse {
  return jsonOk(data, 201);
}

export function jsonNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/** Convierte cualquier excepción en una respuesta HTTP consistente. */
export function jsonError(error: unknown): NextResponse {
  if (isAppError(error)) {
    const body: ApiErrorBody = {
      error: { codigo: error.code, mensaje: error.message, ...(error.details ? { detalles: error.details } : {}) },
    };
    return NextResponse.json(body, { status: error.status });
  }

  // Errores conocidos de Prisma que no fueron validados antes por el servicio.
  const prismaCode = (error as { code?: string })?.code;
  if (prismaCode === "P2002") {
    return NextResponse.json(
      { error: { codigo: "CONFLICTO", mensaje: "Ya existe un registro con esos datos únicos." } },
      { status: 409 },
    );
  }
  if (prismaCode === "P2025") {
    return NextResponse.json(
      { error: { codigo: "NO_ENCONTRADO", mensaje: "El registro solicitado no existe." } },
      { status: 404 },
    );
  }
  if (prismaCode === "P2003") {
    return NextResponse.json(
      { error: { codigo: "DATOS_INVALIDOS", mensaje: "La operación viola una relación entre entidades." } },
      { status: 422 },
    );
  }

  console.error("[api] error no controlado:", error);
  return NextResponse.json(
    { error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error inesperado. Intentá nuevamente." } },
    { status: 500 },
  );
}

/** Lee y valida el cuerpo JSON de una petición. */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("El cuerpo de la petición debe ser JSON válido.");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError("Revisá los datos ingresados.", toFieldErrors(parsed.error));
  }
  return parsed.data;
}

/**
 * Valida los search params de la URL contra un schema de Zod.
 * Los parámetros ausentes no se incluyen, para que apliquen los defaults.
 */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const crudos: Record<string, string> = {};
  for (const [clave, valor] of url.searchParams) {
    if (valor !== "") crudos[clave] = valor;
  }

  const parsed = schema.safeParse(crudos);
  if (!parsed.success) {
    throw new ValidationError("Los parámetros de búsqueda no son válidos.", toFieldErrors(parsed.error));
  }
  return parsed.data;
}

/**
 * Protección CSRF complementaria a la cookie SameSite=Lax: en peticiones que
 * modifican estado se verifica que el origen coincida con el host.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // peticiones server-to-server (Postman, curl, tests)

  const host = request.headers.get("host");
  if (!host) return;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ValidationError("Origen inválido.");
  }

  if (originHost !== host) {
    throw new ValidationError("Origen no permitido.");
  }
}

/** Envuelve un route handler para centralizar el manejo de errores. */
export function withErrorHandling<Ctx>(
  handler: (request: Request, context: Ctx) => Promise<NextResponse>,
): (request: Request, context: Ctx) => Promise<NextResponse> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}
