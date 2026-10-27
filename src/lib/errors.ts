/**
 * Errores de dominio.
 *
 * La capa de servicios lanza estos errores (independientes de HTTP) y la capa
 * de presentación (route handlers) los traduce a códigos de estado. Así la
 * lógica de negocio no conoce detalles del protocolo.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(message: string, status: number, code: string, details?: Record<string, string[]>) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Los datos enviados no son válidos.", details?: Record<string, string[]>) {
    super(message, 422, "DATOS_INVALIDOS", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Necesitás iniciar sesión para realizar esta acción.") {
    super(message, 401, "NO_AUTENTICADO");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tenés permisos para realizar esta acción.") {
    super(message, 403, "SIN_PERMISOS");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "El recurso solicitado no existe.") {
    super(message, 404, "NO_ENCONTRADO");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 409, "CONFLICTO", details);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
