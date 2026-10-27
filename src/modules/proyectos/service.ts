import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { esRolInterno, puedeGestionarProyectos, puedeVerProyecto, type Actor } from "@/modules/auth/policy";
import type { EstadoProyecto } from "@/generated/prisma/enums";
import type {
  ActualizarProyectoInput,
  CrearProyectoInput,
  FiltroProyectosInput,
} from "./schema";
import type { Paginado, ProyectoConCliente, ProyectoRepository } from "./types";

/** Transiciones permitidas del ciclo de vida de un proyecto. */
export const TRANSICIONES_PROYECTO: Record<EstadoProyecto, EstadoProyecto[]> = {
  PLANIFICADO: ["EN_CURSO", "CANCELADO"],
  EN_CURSO: ["PAUSADO", "FINALIZADO", "CANCELADO"],
  PAUSADO: ["EN_CURSO", "CANCELADO"],
  FINALIZADO: [],
  CANCELADO: [],
};

export function transicionPermitida(desde: EstadoProyecto, hacia: EstadoProyecto): boolean {
  return TRANSICIONES_PROYECTO[desde].includes(hacia);
}

export function crearProyectoService(repo: ProyectoRepository) {
  async function listar(actor: Actor, filtro: FiltroProyectosInput): Promise<Paginado<ProyectoConCliente>> {
    // Un usuario CLIENTE solo puede listar proyectos de su empresa, sin
    // importar qué clienteId envíe en la query (prevención de IDOR).
    const filtroAplicado = esRolInterno(actor)
      ? filtro
      : { ...filtro, clienteId: actor.clienteId ?? "__sin_cliente__" };

    const { items, total } = await repo.listar(filtroAplicado);

    return {
      items,
      total,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / filtro.porPagina)),
    };
  }

  async function obtener(actor: Actor, id: string): Promise<ProyectoConCliente> {
    const proyecto = await repo.buscarPorId(id);
    if (!proyecto) {
      throw new NotFoundError("El proyecto no existe.");
    }
    if (!puedeVerProyecto(actor, proyecto)) {
      throw new ForbiddenError("No tenés acceso a este proyecto.");
    }
    return proyecto;
  }

  async function crear(actor: Actor, datos: CrearProyectoInput): Promise<ProyectoConCliente> {
    if (!puedeGestionarProyectos(actor)) {
      throw new ForbiddenError("Solo el personal interno puede crear proyectos.");
    }

    const clienteActivo = await repo.clienteActivo(datos.clienteId);
    if (!clienteActivo) {
      throw new ConflictError("El cliente seleccionado no existe o está dado de baja.", {
        clienteId: ["El cliente seleccionado no existe o está dado de baja."],
      });
    }

    return repo.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      presupuesto: datos.presupuesto ?? null,
      fechaInicio: datos.fechaInicio,
      fechaFinEstimada: datos.fechaFinEstimada ?? null,
      clienteId: datos.clienteId,
      creadoPorId: actor.id,
    });
  }

  async function actualizar(actor: Actor, id: string, datos: ActualizarProyectoInput): Promise<ProyectoConCliente> {
    const proyecto = await obtener(actor, id);
    if (!puedeGestionarProyectos(actor)) {
      throw new ForbiddenError("Solo el personal interno puede modificar proyectos.");
    }
    if (proyecto.estado === "FINALIZADO" || proyecto.estado === "CANCELADO") {
      throw new ConflictError("No se puede modificar un proyecto finalizado o cancelado.");
    }

    return repo.actualizar(id, datos);
  }

  async function cambiarEstado(actor: Actor, id: string, nuevoEstado: EstadoProyecto): Promise<ProyectoConCliente> {
    const proyecto = await obtener(actor, id);
    if (!puedeGestionarProyectos(actor)) {
      throw new ForbiddenError("Solo el personal interno puede cambiar el estado de un proyecto.");
    }
    if (!transicionPermitida(proyecto.estado, nuevoEstado)) {
      throw new ConflictError(`No se puede pasar de "${proyecto.estado}" a "${nuevoEstado}".`);
    }

    return repo.cambiarEstado(id, nuevoEstado);
  }

  /** Baja lógica del proyecto junto con sus tareas. */
  async function desactivar(actor: Actor, id: string): Promise<ProyectoConCliente> {
    const proyecto = await obtener(actor, id);
    if (!puedeGestionarProyectos(actor)) {
      throw new ForbiddenError("Solo el personal interno puede dar de baja proyectos.");
    }
    if (!proyecto.activo) {
      throw new ConflictError("El proyecto ya se encuentra dado de baja.");
    }

    const enProgreso = await repo.contarTareasEnProgreso(id);
    if (enProgreso > 0) {
      throw new ConflictError(
        `No se puede dar de baja el proyecto porque tiene ${enProgreso} tarea(s) en progreso.`,
      );
    }

    return repo.desactivar(id);
  }

  return { listar, obtener, crear, actualizar, cambiarEstado, desactivar };
}

export type ProyectoService = ReturnType<typeof crearProyectoService>;
