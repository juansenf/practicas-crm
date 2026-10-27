# ADR 0007 — Validación compartida con Zod

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

La consigna exige validación estricta **en frontend y backend**. Duplicar reglas en dos lugares garantiza que se desincronicen.

## Decisión

Definir los contratos una sola vez con **Zod 4**, en `src/modules/<módulo>/schema.ts`, y usarlos en ambos lados:

- **Backend**: `parseJson(request, schema)` y `parseQuery(request, schema)` convierten los `issues` en `{ campo: [mensajes] }` (HTTP 422).
- **Frontend**: los formularios ejecutan el mismo esquema antes de enviar y muestran los mensajes por campo (`aria-invalid`, `#campo-error`).

Los esquemas también normalizan (trim, minúsculas en email, quitar guiones del CUIT) y transforman (`"" → undefined`) para que los formularios puedan enviar campos vacíos.

## Consecuencias

**Positivas**

- Un único origen de verdad para las reglas de entrada.
- Los mensajes son consistentes entre UI y API.
- Los tipos TypeScript se derivan del esquema (`z.infer`).

**Negativas**

- Los esquemas se ejecutan en el cliente, así que su tamaño debe cuidarse (Zod 4 es razonablemente compacto).
- Las reglas que dependen de la base (unicidad, existencia de FK) siguen viviendo en el servicio, no en el esquema.
