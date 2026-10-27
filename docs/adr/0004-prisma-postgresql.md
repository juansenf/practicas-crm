# ADR 0004 — Prisma 7 + PostgreSQL con migraciones versionadas

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

La consigna exige una base relacional normalizada, con claves foráneas, índices y **migraciones versionadas**. Las opciones eran SQL a mano, un query builder o un ORM con migraciones.

## Decisión

**Prisma 7** con el generador `prisma-client` (salida en `src/generated/prisma`) y el adaptador `@prisma/adapter-pg` sobre PostgreSQL.

- `prisma/migrations/` versionado en el repositorio.
- `prisma migrate dev` en desarrollo y `prisma migrate deploy` en CI/producción.
- `prisma.config.ts` centraliza el esquema, la carpeta de migraciones y el seed.
- Nunca se usa `db push` fuera de prototipos descartables.

## Consecuencias

**Positivas**

- Esquema tipado y autocompletado; el cliente se regenera con `npm run db:generate`.
- Historial reproducible: la misma secuencia de migraciones crea la base desde cero.
- El adaptador `pg` permite usar el pool de Node y funcionar con proveedores serverless (Neon, Vercel Postgres).

**Negativas**

- Prisma 7 ya no carga `.env` automáticamente: `prisma.config.ts` importa `dotenv/config`.
- `migrate dev` ya no ejecuta `generate` ni el seed: se invocan explícitamente desde `package.json`.
- El cliente generado se excluye de git y de la cobertura.
