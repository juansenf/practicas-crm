import type { EstadoProyecto } from "@/generated/prisma/enums";
import { formatMoneda } from "@/lib/format";

export const ESTADOS_PROYECTO: EstadoProyecto[] = [
  "PLANIFICADO",
  "EN_CURSO",
  "PAUSADO",
  "FINALIZADO",
  "CANCELADO",
];

export function estadoProyectoTono(estado: EstadoProyecto): "neutral" | "exito" | "advertencia" | "peligro" | "info" {
  switch (estado) {
    case "EN_CURSO":
      return "exito";
    case "PLANIFICADO":
      return "info";
    case "PAUSADO":
      return "advertencia";
    case "CANCELADO":
      return "peligro";
    default:
      return "neutral";
  }
}

/** Helper de presentación reexportado para evitar duplicar formato en páginas. */
export { formatMoneda };
