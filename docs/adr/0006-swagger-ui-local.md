# ADR 0006 — Swagger UI servido localmente

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

Se debe entregar documentación de la API. Swagger UI es el estándar, pero la forma habitual (CDN de `unpkg`/`jsdelivr`) choca con la política de seguridad del proyecto: `Content-Security-Policy: default-src 'self'` no permite scripts de terceros.

## Decisión

Versionar el bundle de Swagger UI dentro de `public/docs/swagger-ui/` (copiado desde el paquete `swagger-ui-dist`) y montarlo en `/docs` con un componente cliente que carga el script desde el mismo origen.

El contrato vive en `public/openapi.yaml` (OpenAPI 3.1) y es la fuente de verdad de la API.

## Consecuencias

**Positivas**

- Compatible con la CSP estricta (sin `script-src` externos).
- Funciona sin conexión a internet y en entornos con red restringida.
- La documentación viaja con el despliegue: siempre coincide con lo publicado.

**Negativas**

- El bundle (~1,7 MB) queda en el repositorio y no se actualiza solo: hay que recopiarlo al subir de versión `swagger-ui-dist`.
- La CSP requiere `'unsafe-inline'` para los estilos que inyecta Swagger (no para scripts).
