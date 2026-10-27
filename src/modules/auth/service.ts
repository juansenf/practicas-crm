import { AppError, ConflictError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { crearLimitador, type Limitador } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "./password";
import type { LoginInput, RegistroInput } from "./schema";
import type { AuthRepository } from "./types";
import type { Actor } from "./policy";

/**
 * Hash de relleno: si el email no existe igual ejecutamos bcrypt.compare para
 * que el tiempo de respuesta no revele qué cuentas están registradas
 * (mitigación de enumeración de usuarios).
 */
const HASH_RELLENO = "$2b$12$ChnmvAD8t6AjC5a/TuUyj.etTL/RnlordRfMPTP3g5ueN60F7yh7q";

const MENSAJE_CREDENCIALES = "Email o contraseña incorrectos.";

export function crearAuthService(repo: AuthRepository, deps: { limitador?: Limitador } = {}) {
  const limitador = deps.limitador ?? crearLimitador({ max: 5, ventanaMs: 15 * 60 * 1000 });

  async function iniciarSesion({ email, password }: LoginInput): Promise<Actor> {
    const limite = limitador.consumir(email);
    if (!limite.permitido) {
      throw new AppError(
        `Demasiados intentos fallidos. Probá de nuevo en ${limite.reintentarEnSegundos} segundos.`,
        429,
        "DEMASIADOS_INTENTOS",
      );
    }

    const usuario = await repo.buscarPorEmail(email);
    const passwordValida = await verifyPassword(password, usuario?.passwordHash ?? HASH_RELLENO);

    if (!usuario || !passwordValida) {
      throw new UnauthorizedError(MENSAJE_CREDENCIALES);
    }
    if (!usuario.activo) {
      throw new ForbiddenError("Tu cuenta está deshabilitada. Contactá al administrador.");
    }

    limitador.reiniciar(email);

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
    };
  }

  /**
   * Auto-registro del portal de clientes: crea la empresa y su usuario CLIENTE
   * en una única transacción para no dejar registros huérfanos.
   */
  async function registrar({ nombre, empresa, email, password }: RegistroInput): Promise<Actor> {
    const existente = await repo.buscarPorEmail(email);
    if (existente) {
      throw new ConflictError("Ya existe una cuenta registrada con ese email.", {
        email: ["Ya existe una cuenta registrada con ese email."],
      });
    }

    const usuario = await repo.crearClienteConUsuario({
      empresa,
      nombre,
      email,
      passwordHash: await hashPassword(password),
    });

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
    };
  }

  return { iniciarSesion, registrar };
}

export type AuthService = ReturnType<typeof crearAuthService>;
