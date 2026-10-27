export type DetallesError = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalles?: DetallesError;

  constructor(mensaje: string, status: number, codigo: string, detalles?: DetallesError) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

type ErrorApi = {
  error?: { mensaje?: string; codigo?: string; detalles?: DetallesError };
};

/**
 * Cliente HTTP del frontend. Centraliza el manejo de errores del backend
 * (incluidos los errores de validación por campo) para que los formularios
 * no repitan lógica.
 */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as (T & ErrorApi) | null;

  if (!respuesta.ok) {
    throw new ApiError(
      cuerpo?.error?.mensaje ?? "Ocurrió un error inesperado.",
      respuesta.status,
      cuerpo?.error?.codigo ?? "ERROR_DESCONOCIDO",
      cuerpo?.error?.detalles,
    );
  }

  return cuerpo as T;
}
