"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { Select } from "@/components/ui";
import type { EstadoTarea } from "@/generated/prisma/enums";

const ETIQUETAS: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  BLOQUEADA: "Bloqueada",
  COMPLETADA: "Completada",
};

export function AccionesTarea({
  id,
  estado,
  permitidos,
  editable,
}: {
  id: string;
  estado: EstadoTarea;
  permitidos: EstadoTarea[];
  editable: boolean;
}) {
  const [procesando, setProcesando] = useState(false);
  const { mostrar } = useToast();
  const router = useRouter();

  async function cambiarEstado(nuevo: string) {
    if (!nuevo) return;
    setProcesando(true);
    try {
      await apiFetch(`/api/v1/tareas/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevo }),
      });
      mostrar("Estado de la tarea actualizado.", "exito");
      router.refresh();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : "No se pudo cambiar el estado.", "error");
    } finally {
      setProcesando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm("¿Dar de baja esta tarea?")) return;
    setProcesando(true);
    try {
      await apiFetch(`/api/v1/tareas/${id}`, { method: "DELETE" });
      mostrar("Tarea dada de baja.", "exito");
      router.refresh();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : "No se pudo dar de baja la tarea.", "error");
    } finally {
      setProcesando(false);
    }
  }

  if (!editable) {
    return <span className="text-xs text-slate-500">{ETIQUETAS[estado]}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Cambiar estado de la tarea"
        value=""
        onChange={(evento) => cambiarEstado(evento.target.value)}
        disabled={procesando || permitidos.length === 0}
        className="w-auto min-w-36 py-1.5 text-xs"
      >
        <option value="">{ETIQUETAS[estado]}</option>
        {permitidos.map((opcion) => (
          <option key={opcion} value={opcion}>
            → {ETIQUETAS[opcion]}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={eliminar}
        disabled={procesando}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-red-300"
      >
        Eliminar
      </button>
    </div>
  );
}
