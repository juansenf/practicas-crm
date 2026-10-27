import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { puedeGestionarClientes, puedeVerCliente, type Actor } from "@/modules/auth/policy";
import type { CrearClienteInput, ActualizarClienteInput, FiltroClientesInput } from "./schema";
import type { Cliente, ClienteRepository, DatosCliente, Paginado } from "./types";

export function crearClienteService(repo: ClienteRepository) {
  async function listar(actor: Actor, filtro: FiltroClientesInput): Promise<Paginado<Cliente>> {
    if (!puedeGestionarClientes(actor)) {
      throw new ForbiddenError("Solo el personal interno puede administrar clientes.");
    }

    const { items, total } = await repo.listar(filtro);
    return {
      items,
      total,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / filtro.porPagina)),
    };
  }

  async function obtener(actor: Actor, id: string): Promise<Cliente> {
    const cliente = await repo.buscarPorId(id);
    if (!cliente) {
      throw new NotFoundError("El cliente no existe.");
    }
    if (!puedeVerCliente(actor, cliente.id)) {
      throw new ForbiddenError("No tenés acceso a la información de este cliente.");
    }
    return cliente;
  }

  async function crear(actor: Actor, datos: CrearClienteInput): Promise<Cliente> {
    if (!puedeGestionarClientes(actor)) {
      throw new ForbiddenError("Solo el personal interno puede crear clientes.");
    }

    const existente = await repo.buscarPorEmail(datos.email);
    if (existente) {
      throw new ConflictError("Ya existe un cliente con ese email.", {
        email: ["Ya existe un cliente registrado con ese email."],
      });
    }

    if (datos.cuit) {
      const porCuit = await repo.buscarPorCuit(datos.cuit);
      if (porCuit) {
        throw new ConflictError("Ya existe un cliente con ese CUIT.", {
          cuit: ["Ya existe un cliente registrado con ese CUIT."],
        });
      }
    }

    return repo.crear(normalizar(datos));
  }

  async function actualizar(actor: Actor, id: string, datos: ActualizarClienteInput): Promise<Cliente> {
    await obtener(actor, id);
    if (!puedeGestionarClientes(actor)) {
      throw new ForbiddenError("Solo el personal interno puede modificar clientes.");
    }

    if (datos.email) {
      const porEmail = await repo.buscarPorEmail(datos.email);
      if (porEmail && porEmail.id !== id) {
        throw new ConflictError("Ya existe otro cliente con ese email.", {
          email: ["Ya existe otro cliente registrado con ese email."],
        });
      }
    }

    if (datos.cuit) {
      const porCuit = await repo.buscarPorCuit(datos.cuit);
      if (porCuit && porCuit.id !== id) {
        throw new ConflictError("Ya existe otro cliente con ese CUIT.", {
          cuit: ["Ya existe otro cliente registrado con ese CUIT."],
        });
      }
    }

    return repo.actualizar(id, datos);
  }

  /**
   * Baja lógica. Se bloquea si el cliente tiene proyectos vigentes para no
   * dejar trabajo en curso asociado a un registro inactivo.
   */
  async function desactivar(actor: Actor, id: string): Promise<Cliente> {
    const cliente = await obtener(actor, id);
    if (!puedeGestionarClientes(actor)) {
      throw new ForbiddenError("Solo el personal interno puede dar de baja clientes.");
    }
    if (!cliente.activo) {
      throw new ConflictError("El cliente ya se encuentra dado de baja.");
    }

    const proyectosActivos = await repo.contarProyectosActivos(id);
    if (proyectosActivos > 0) {
      throw new ConflictError(
        `No se puede dar de baja el cliente porque tiene ${proyectosActivos} proyecto(s) activo(s).`,
      );
    }

    return repo.desactivar(id);
  }

  async function reactivar(actor: Actor, id: string): Promise<Cliente> {
    await obtener(actor, id);
    if (!puedeGestionarClientes(actor)) {
      throw new ForbiddenError("Solo el personal interno puede reactivar clientes.");
    }
    return repo.reactivar(id);
  }

  return { listar, obtener, crear, actualizar, desactivar, reactivar };
}

function normalizar(datos: CrearClienteInput): DatosCliente {
  return {
    nombre: datos.nombre,
    email: datos.email,
    cuit: datos.cuit ?? null,
    telefono: datos.telefono ?? null,
    direccion: datos.direccion ?? null,
    notas: datos.notas ?? null,
  };
}

export type ClienteService = ReturnType<typeof crearClienteService>;
