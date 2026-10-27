## Descripción

<!-- ¿Qué cambia y por qué? Enlazá la historia de usuario o el issue. -->

Closes #

## Tipo de cambio

- [ ] Nueva funcionalidad (`feat`)
- [ ] Corrección de error (`fix`)
- [ ] Refactorización (`refactor`)
- [ ] Documentación (`docs`)
- [ ] Pruebas (`test`)
- [ ] Infraestructura / CI (`ci`, `chore`, `build`)

## Cambios principales

<!-- Lista breve de lo implementado. -->

-
-

## Cómo probarlo

<!-- Pasos para verificar el cambio localmente. -->

1.
2.

## Evidencia

<!-- Capturas, salida de tests, o referencia a la bitácora. -->

## Checklist de auto-revisión

- [ ] El código respeta la separación de capas (nada de Prisma en componentes).
- [ ] Hay validación Zod del lado del servidor y mensajes de error claros.
- [ ] Los permisos se verifican en el servicio, no sólo en la UI.
- [ ] Se agregaron o actualizaron pruebas para la regla de negocio tocada.
- [ ] `npm run lint` pasa sin errores ni warnings nuevos.
- [ ] `npm run typecheck` pasa.
- [ ] `npm test` pasa (unitarias + integración).
- [ ] `npm run build` pasa.
- [ ] La documentación (`README`, `openapi.yaml`, backlog, bitácora) quedó actualizada si corresponde.
- [ ] No se commitean secretos, archivos `.env` ni artefactos generados.

## Notas para la revisión

<!-- Decisiones, dudas o puntos donde conviene mirar con atención. -->
