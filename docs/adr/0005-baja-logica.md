# ADR 0005 — Baja lógica en lugar de borrado físico

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

La consigna pide CRUD completo **con baja lógica** para al menos tres entidades relacionadas. Un estudio necesita conservar el historial de clientes, proyectos y tareas: borrar físicamente destruiría la trazabilidad y rompería reportes históricos.

## Decisión

Todas las entidades de negocio (`Cliente`, `Proyecto`, `Tarea`) tienen:

- `activo: boolean` (default `true`) e índice cuando se filtra por él.
- `eliminadoEn: DateTime?` para auditoría.

Reglas asociadas:

- Dar de baja un **cliente** falla con `409` si tiene proyectos activos.
- Dar de baja un **proyecto** desactiva en cascada sus tareas, dentro de una transacción, y falla si hay tareas en progreso.
- Dar de baja una **tarea** sólo la marca como inactiva.
- Los listados excluyen inactivos por defecto; el filtro `activo` permite verlos.
- La reactivación es explícita (`POST /clientes/{id}/reactivar`).

Los usuarios (`Usuario`) usan `activo` como habilitación de cuenta: un usuario inactivo no puede iniciar sesión y `obtenerActor()` lo rechaza.

## Consecuencias

**Positivas**

- Historial completo y auditable; nada se pierde por error.
- Las FK se mantienen íntegras (no hay huérfanos).

**Negativas**

- Todas las consultas de listado deben recordar filtrar por `activo`.
- La unicidad de `email` y `cuit` se mantiene incluso en registros dados de baja: si se quiere reutilizar un email, hay que reactivar el registro (decisión consciente para no duplicar identidades).
