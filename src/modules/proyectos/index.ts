import { proyectoRepository } from "./repository.prisma";
import { crearProyectoService } from "./service";

export const proyectoService = crearProyectoService(proyectoRepository);
