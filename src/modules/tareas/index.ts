import { tareaRepository } from "./repository.prisma";
import { crearTareaService } from "./service";

export const tareaService = crearTareaService(tareaRepository);
