import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "./env";

/**
 * Cliente único de Prisma. En desarrollo se reutiliza la misma instancia
 * entre recargas de HMR para no agotar el pool de conexiones.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getEnv().DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (getEnv().NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
