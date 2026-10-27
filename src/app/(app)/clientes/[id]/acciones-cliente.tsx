"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { Boton } from "@/components/ui";

export function AccionesCliente({ id, activo }: { id: string; activo: boolean }) {
  const [cargando, setCargando] = useState(false);
  const { mostrar } = useToast();
  const router = useRouter();

  async function ejecutar() {
    const mensaje = activo
      ? "¿Dar de baja este cliente? No se borra el historial, solo queda inactivo."
      : "¿Reactivar este cliente?";
    if (!window.confirm(mensaje)) return;

    setCargando(true);
    try {
      await apiFetch(activo ? `/api/v1/clientes/${id}` : `/api/v1/clientes/${id}/reactivar`, {
        method: activo ? "DELETE" : "POST",
      });
      mostrar(activo ? "Cliente dado de baja." : "Cliente reactivado.", "exito");
      router.refresh();
    } catch (error) {
      mostrar(
        error instanceof ApiError ? error.message : "No se pudo completar la operación.",
        "error",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <Boton variante={activo ? "peligro" : "secundario"} onClick={ejecutar} disabled={cargando}>
      {cargando ? "Procesando…" : activo ? "Dar de baja" : "Reactivar cliente"}
    </Boton>
  );
}
