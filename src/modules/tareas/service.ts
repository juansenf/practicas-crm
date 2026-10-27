import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  esRolInterno,
  puedeGestionarTareas,
  puedeVerTarea,
  type Actor,
} from "@/modules/auth/policy";
import type { EstadoTarea } from "@/generated/prisma/enums";
import type { CrearTareaInput, ActualizarTareaInput, FiltroTareasInput } from "./schema";
import type { Paginado, ProyectoResumen, Tarea, TareaRepository } from "./types";

export const TRANSICIONES_TAREA: Record<EstadoTarea, EstadoTarea[]> = {
  PENDIENTE: ["EN_PROGRESO", "BLOQUEADA", "COMPLETADA"],
  EN_PROGRESO: ["PENDIENTE", "BLOQUEADA", "COMPLETADA"],
  BLOQUEADA: ["PENDIENTE", "EN_PROGRESO"],
  COMPLETADA: ["EN_PROGRESO"],
};

export function transicionTareaPermitida(desde: EstadoTarea, hacia: EstadoTarea): boolean {
  return TRANSICIONES_TAREA[desde].includes(hacia);
}

/** Un proyecto cerrado o dado de baja no admite cambios en sus tareas. */
function proyectoEditable(proyecto: ProyectoResumen): boolean {
  return proyecto.activo && proyecto.estado !== "FINALIZADO" && proyecto.estado !== "CANCELADO";
}

export function crearTareaService(repo: TareaRepository) {
  async function listar(actor: Actor, filtro: FiltroTareasInput): Promise<Paginado<Tarea>> {
    const filtroAplicado = esRolInterno(actor)
      ? filtro
      : { ...filtro, clienteId: actor.clienteId ?? "__sin_cliente__", responsableId: undefined };

    const { items, total } = await repo.listar(filtroAplicado);

    return {
      items,
      total,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / filtro.porPagina)),
    };
  }

  async function obtener(actor: Actor, id: string): Promise<Tarea> {
    const tarea = await repo.buscarPorId(id);
    if (!tarea) {
      throw new NotFoundError("La tarea no existe.");
    }
    if (!puedeVerTarea(actor, tarea.proyecto)) {
      throw new ForbiddenError("No tenés acceso a esta tarea.");
    }
    return tarea;
  }

  async function crear(actor: Actor, datos: CrearTareaInput): Promise<Tarea> {
    if (!puedeGestionarTareas(actor)) {
      throw new ForbiddenError("Solo el personal interno puede crear tareas.");
    }

    const proyecto = await repo.proyectoDisponible(datos.proyectoId);
    if (!proyecto) {
      throw new ConflictError("El proyecto no existe o está dado de baja.", {
        proyectoId: ["El proyecto no existe o está dado de baja."],
      });
    }
    if (!proyectoEditable(proyecto)) {
      throw new ConflictError("No se pueden agregar tareas a un proyecto finalizado o cancelado.");
    }

    await validarResponsable(repo, datos.responsableId);

    return repo.crear({
      titulo: datos.titulo,
      descripcion: datos.descripcion ?? null,
      prioridad: datos.prioridad,
      fechaLimite: datos.fechaLimite ?? null,
      horasEstimadas: datos.horasEstimadas ?? null,
      proyectoId: datos.proyectoId,
      responsableId: datos.responsableId ?? null,
    });
  }

  async function actualizar(actor: Actor, id: string, datos: ActualizarTareaInput): Promise<Tarea> {
    const tarea = await obtener(actor, id);
    if (!puedeGestionarTareas(actor)) {
      throw new ForbiddenError("Solo el personal interno puede modificar tareas.");
    }
    if (!proyectoEditable(tarea.proyecto)) {
      throw new ConflictError("No se pueden modificar tareas de un proyecto finalizado o cancelado.");
    }

    if (datos.responsableId !== undefined) {
      await validarResponsable(repo, datos.responsableId);
    }

    return repo.actualizar(id, datos);
  }

  async function cambiarEstado(actor: Actor, id: string, nuevoEstado: EstadoTarea): Promise<Tarea> {
    const tarea = await obtener(actor, id);
    if (!puedeGestionarTareas(actor)) {
      throw new ForbiddenError("Solo el personal interno puede cambiar el estado de una tarea.");
    }
    if (tarea.proyecto.estado === "CANCELADO") {
      throw new ConflictError("El proyecto está cancelado: no admite cambios en sus tareas.");
    }
    if (!transicionTareaPermitida(tarea.estado, nuevoEstado)) {
      throw new ConflictError(`No se puede pasar de "${tarea.estado}" a "${nuevoEstado}".`);
    }

    return repo.cambiarEstado(id, nuevoEstado);
  }

  async function desactivar(actor: Actor, id: string): Promise<Tarea> {
    await obtener(actor, id);
    if (!puedeGestionarTareas(actor)) {
      throw new ForbiddenError("Solo el personal interno puede dar de baja tareas.");
    }
    return repo.desactivar(id);
  }

  return { listar, obtener, crear, actualizar, cambiarEstado, desactivar };
}

async function validarResponsable(repo: TareaRepository, responsableId?: string | null): Promise<void> {
  if (!responsableId) return;

  const activo = await repo.usuarioActivo(responsableId);
  if (!activo) {
    throw new ConflictError("El responsable seleccionado no existe o está deshabilitado.", {
      responsableId: ["El responsable seleccionado no existe o está deshabilitado."],
    });
  }
}

export type TareaService = ReturnType<typeof crearTareaService>;
