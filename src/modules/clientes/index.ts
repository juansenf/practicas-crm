import { clienteRepository } from "./repository.prisma";
import { crearClienteService } from "./service";

/**
 * Composición del módulo: única instancia del servicio con su repositorio
 * concreto. Los tests construyen el servicio con repositorios en memoria.
 */
export const clienteService = crearClienteService(clienteRepository);
