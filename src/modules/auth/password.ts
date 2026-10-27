import { compare, hash } from "bcryptjs";

/**
 * Costo de bcrypt. 12 rondas es un valor recomendado para 2026 y mantiene
 * el login por debajo de ~300 ms en hardware de servidor.
 */
export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}
