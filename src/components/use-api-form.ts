"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, type DetallesError } from "@/lib/api-client";
import { useToast } from "@/components/toast";

type Opciones = {
  mensajeExito?: string;
  alTerminar?: () => void;
};

/**
 * Hook reutilizable para formularios que consumen la API REST.
 * Expone los errores de validación del backend por campo y muestra feedback.
 */
export function useApiForm<T extends Record<string, unknown>>(
  url: string,
  metodo: "POST" | "PATCH" = "POST",
) {
  const [errores, setErrores] = useState<DetallesError>({});
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const { mostrar } = useToast();

  async function enviar(datos: T, opciones: Opciones = {}): Promise<boolean> {
    setEnviando(true);
    setErrores({});

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as {
          error?: { mensaje?: string; detalles?: DetallesError };
        } | null;
        const mensaje = cuerpo?.error?.mensaje ?? "No se pudo completar la operación.";
        setErrores(cuerpo?.error?.detalles ?? {});
        mostrar(mensaje, "error");
        return false;
      }

      mostrar(opciones.mensajeExito ?? "Operación realizada con éxito.", "exito");
      opciones.alTerminar?.();
      router.refresh();
      return true;
    } catch {
      mostrar("No se pudo conectar con el servidor. Revisá tu conexión.", "error");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { enviar, errores, enviando, limpiarErrores: () => setErrores({}) };
}

export { ApiError };
