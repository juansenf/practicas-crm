# ADR 0001 — Next.js App Router como framework full-stack

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

El proyecto es individual, con plazo acotado y debe desplegarse en la nube con autenticación, API REST documentada y una UI responsive. Mantener dos aplicaciones (SPA + API) duplica configuración, despliegue y autenticación.

## Decisión

Usar **Next.js 16 con App Router** como framework único:

- *Server Components* para las páginas.
- *Route handlers* en `src/app/api/v1` para la API REST.
- `src/proxy.ts` para la verificación optimista de sesión.

## Consecuencias

**Positivas**

- Un solo despliegue y un solo pipeline.
- Menos JavaScript enviado al cliente (RSC).
- La cookie `HttpOnly` puede emitirse desde un route handler del mismo origen, sin CORS.

**Negativas**

- El modelo de ejecución (server/client) exige disciplina: `"use client"` sólo donde hace falta.
- El middleware/proxy corre en un runtime restringido: no puede consultar la base en cada request, por lo que la autorización real se hace en páginas y servicios.
