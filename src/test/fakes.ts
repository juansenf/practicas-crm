import type { Cliente, ClienteRepository, DatosCliente } from "@/modules/clientes/types";
import type { AuthRepository, UsuarioAuth } from "@/modules/auth/types";
import type { ProyectoConCliente, ProyectoRepository } from "@/modules/proyectos/types";
import type { Tarea, TareaRepository } from "@/modules/tareas/types";

/** Dobles de prueba en memoria: permiten testear servicios sin base de datos. */

export function crearClienteRepositorioMemoria(
  inicial: Cliente[] = [],
  opciones: { proyectosActivos?: Record<string, number> } = {},
) {
  const clientes = [...inicial];
  let secuencia = inicial.length;

  const repo: ClienteRepository = {
    async listar(filtro) {
      const filtrados = clientes.filter(
        (cliente) =>
          (filtro.activo === undefined || cliente.activo === filtro.activo) &&
          (!filtro.q ||
            cliente.nombre.toLowerCase().includes(filtro.q.toLowerCase()) ||
            cliente.email.toLowerCase().includes(filtro.q.toLowerCase())),
      );
      const inicio = (filtro.pagina - 1) * filtro.porPagina;
      return { items: filtrados.slice(inicio, inicio + filtro.porPagina), total: filtrados.length };
    },
    async buscarPorId(id) {
      return clientes.find((cliente) => cliente.id === id) ?? null;
    },
    async buscarPorEmail(email) {
      return clientes.find((cliente) => cliente.email === email) ?? null;
    },
    async buscarPorCuit(cuit) {
      return clientes.find((cliente) => cliente.cuit === cuit) ?? null;
    },
    async contarProyectosActivos(clienteId) {
      return opciones.proyectosActivos?.[clienteId] ?? 0;
    },
    async crear(datos: DatosCliente) {
      const cliente: Cliente = {
        id: `cliente-${++secuencia}`,
        ...datos,
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };
      clientes.push(cliente);
      return cliente;
    },
    async actualizar(id, datos) {
      const cliente = clientes.find((item) => item.id === id);
      if (!cliente) throw new Error("no encontrado");
      Object.assign(cliente, datos, { actualizadoEn: new Date() });
      return cliente;
    },
    async desactivar(id) {
      const cliente = clientes.find((item) => item.id === id);
      if (!cliente) throw new Error("no encontrado");
      cliente.activo = false;
      return cliente;
    },
    async reactivar(id) {
      const cliente = clientes.find((item) => item.id === id);
      if (!cliente) throw new Error("no encontrado");
      cliente.activo = true;
      return cliente;
    },
  };

  return { repo, clientes };
}

export function crearProyectoRepositorioMemoria(
  inicial: ProyectoConCliente[] = [],
  opciones: { clientesActivos?: string[]; tareasEnProgreso?: Record<string, number> } = {},
) {
  const proyectos = [...inicial];

  const repo: ProyectoRepository = {
    async listar(filtro) {
      const filtrados = proyectos.filter(
        (proyecto) =>
          proyecto.activo &&
          (!filtro.estado || proyecto.estado === filtro.estado) &&
          (!filtro.clienteId || proyecto.clienteId === filtro.clienteId),
      );
      return { items: filtrados, total: filtrados.length };
    },
    async buscarPorId(id) {
      return proyectos.find((proyecto) => proyecto.id === id) ?? null;
    },
    async clienteActivo(clienteId) {
      return opciones.clientesActivos?.includes(clienteId) ?? true;
    },
    async crear(datos) {
      const proyecto: ProyectoConCliente = {
        id: `proyecto-${proyectos.length + 1}`,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        estado: "PLANIFICADO",
        presupuesto: datos.presupuesto,
        fechaInicio: datos.fechaInicio,
        fechaFinEstimada: datos.fechaFinEstimada,
        activo: true,
        clienteId: datos.clienteId,
        creadoPorId: datos.creadoPorId,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        cliente: { id: datos.clienteId, nombre: "Cliente de prueba" },
      };
      proyectos.push(proyecto);
      return proyecto;
    },
    async actualizar(id, datos) {
      const proyecto = proyectos.find((item) => item.id === id);
      if (!proyecto) throw new Error("no encontrado");
      Object.assign(proyecto, datos);
      return proyecto;
    },
    async cambiarEstado(id, estado) {
      const proyecto = proyectos.find((item) => item.id === id);
      if (!proyecto) throw new Error("no encontrado");
      proyecto.estado = estado;
      return proyecto;
    },
    async desactivar(id) {
      const proyecto = proyectos.find((item) => item.id === id);
      if (!proyecto) throw new Error("no encontrado");
      proyecto.activo = false;
      return proyecto;
    },
    async contarTareasEnProgreso(proyectoId) {
      return opciones.tareasEnProgreso?.[proyectoId] ?? 0;
    },
  };

  return { repo, proyectos };
}

export function crearTareaRepositorioMemoria(
  inicial: Tarea[] = [],
  opciones: {
    proyectos?: Record<string, { id: string; nombre: string; clienteId: string; estado: string; activo: boolean }>;
    usuariosActivos?: string[];
  } = {},
) {
  const tareas = [...inicial];

  const repo: TareaRepository = {
    async listar(filtro) {
      const filtradas = tareas.filter(
        (tarea) =>
          tarea.activo &&
          (!filtro.estado || tarea.estado === filtro.estado) &&
          (!filtro.proyectoId || tarea.proyectoId === filtro.proyectoId) &&
          (!filtro.clienteId || tarea.proyecto.clienteId === filtro.clienteId),
      );
      return { items: filtradas, total: filtradas.length };
    },
    async buscarPorId(id) {
      return tareas.find((tarea) => tarea.id === id) ?? null;
    },
    async proyectoDisponible(proyectoId) {
      return opciones.proyectos?.[proyectoId] ?? null;
    },
    async usuarioActivo(usuarioId) {
      return opciones.usuariosActivos?.includes(usuarioId) ?? false;
    },
    async crear(datos) {
      const proyecto = opciones.proyectos?.[datos.proyectoId];
      const tarea: Tarea = {
        id: `tarea-${tareas.length + 1}`,
        ...datos,
        estado: "PENDIENTE",
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        proyecto: {
          id: datos.proyectoId,
          nombre: proyecto?.nombre ?? "Proyecto",
          clienteId: proyecto?.clienteId ?? "cliente-1",
          estado: proyecto?.estado ?? "EN_CURSO",
          activo: proyecto?.activo ?? true,
        },
        responsable: null,
      };
      tareas.push(tarea);
      return tarea;
    },
    async actualizar(id, datos) {
      const tarea = tareas.find((item) => item.id === id);
      if (!tarea) throw new Error("no encontrada");
      Object.assign(tarea, datos);
      return tarea;
    },
    async cambiarEstado(id, estado) {
      const tarea = tareas.find((item) => item.id === id);
      if (!tarea) throw new Error("no encontrada");
      tarea.estado = estado;
      return tarea;
    },
    async desactivar(id) {
      const tarea = tareas.find((item) => item.id === id);
      if (!tarea) throw new Error("no encontrada");
      tarea.activo = false;
      return tarea;
    },
  };

  return { repo, tareas };
}

export function crearAuthRepositorioMemoria(usuarios: UsuarioAuth[] = []) {
  const repo: AuthRepository = {
    async buscarPorEmail(email) {
      return usuarios.find((usuario) => usuario.email === email) ?? null;
    },
    async crearClienteConUsuario(datos) {
      const usuario: UsuarioAuth = {
        id: `usuario-${usuarios.length + 1}`,
        nombre: datos.nombre,
        email: datos.email,
        passwordHash: datos.passwordHash,
        rol: "CLIENTE",
        activo: true,
        clienteId: `cliente-${usuarios.length + 1}`,
      };
      usuarios.push(usuario);
      return usuario;
    },
  };
  return { repo, usuarios };
}
