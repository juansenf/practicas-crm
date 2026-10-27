"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { Boton, Select } from "@/components/ui";
import type { EstadoProyecto } from "@/generated/prisma/enums";

export function AccionesProyecto({
  id,
  estado,
  permitidos,
}: {
  id: string;
  estado: EstadoProyecto;
  permitidos: EstadoProyecto[];
}) {
  const [destino, setDestino] = useState("");
  const [procesando, setProcesando] = useState(false);
  const { mostrar } = useToast();
  const router = useRouter();

  async function cambiarEstado() {
    if (!destino) return;
    setProcesando(true);
    try {
      await apiFetch(`/api/v1/proyectos/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: destino }),
      });
      mostrar(`El proyecto pasó a "${destino.replace("_", " ")}".`, "exito");
      setDestino("");
      router.refresh();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : "No se pudo cambiar el estado.", "error");
    } finally {
      setProcesando(false);
    }
  }

  async function darDeBaja() {
    if (!window.confirm("¿Dar de baja el proyecto? Sus tareas también quedarán inactivas.")) return;
    setProcesando(true);
    try {
      await apiFetch(`/api/v1/proyectos/${id}`, { method: "DELETE" });
      mostrar("Proyecto dado de baja.", "exito");
      router.refresh();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : "No se pudo dar de baja el proyecto.", "error");
    } finally {
      setProcesando(false);
    }
  }

  if (permitidos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        El proyecto está en estado <strong>{estado.replace("_", " ")}</strong> y no admite más cambios.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nuevo-estado" className="mb-1.5 block text-sm font-medium text-slate-700">
          Cambiar estado
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            id="nuevo-estado"
            value={destino}
            onChange={(evento) => setDestino(evento.target.value)}
            disabled={procesando}
          >
            <option value="">Seleccioná el nuevo estado…</option>
            {permitidos.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Boton onClick={cambiarEstado} disabled={!destino || procesando} className="sm:w-auto">
            {procesando ? "Aplicando…" : "Aplicar"}
          </Boton>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <Boton variante="peligro" onClick={darDeBaja} disabled={procesando}>
          Dar de baja proyecto
        </Boton>
      </div>
    </div>
  );
}
