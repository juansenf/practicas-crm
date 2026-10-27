import { authRepository } from "./repository.prisma";
import { crearAuthService } from "./service";

export const authService = crearAuthService(authRepository);
