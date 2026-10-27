# Tablero Kanban

El proyecto se gestionó con un tablero de cinco columnas. Este documento conserva el estado de las historias al momento de la entrega; el tablero vivo se mantiene en **GitHub Projects** del repositorio.

## Columnas y reglas

| Columna | Significado | Límite WIP |
| --- | --- | --- |
| **Backlog** | Historias priorizadas que todavía no se empezaron. | — |
| **Por hacer** | Historia lista para desarrollar (criterios de aceptación escritos). | — |
| **En curso** | En implementación; se trabaja en una rama `feature/` o `bugfix/`. | 2 |
| **En revisión** | Pull request abierto, CI corriendo o auto-revisión pendiente. | 2 |
| **Hecho** | Mergeado a `main` con CI en verde y *Definition of Done* cumplida. | — |

**Regla de flujo:** una historia no pasa a *Hecho* sin PR, CI en verde, pruebas de la regla de negocio y documentación actualizada. Los defectos usan la misma columna pero con tarjeta `BUG-XX`.

## Tablero al cierre de la entrega

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│    BACKLOG      │    POR HACER    │    EN CURSO     │  EN REVISIÓN    │      HECHO      │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │                 │ HU-01 Registro  │
│                 │                 │                 │                 │ HU-02 Login     │
│                 │                 │                 │                 │ HU-03 Logout    │
│                 │                 │                 │                 │ HU-04 RBAC      │
│                 │                 │                 │                 │ HU-05 Clientes  │
│                 │                 │                 │                 │ HU-06 Edición   │
│                 │                 │                 │                 │ HU-07 Baja      │
│                 │                 │                 │                 │ HU-08 Proyectos │
│                 │                 │                 │                 │ HU-09 Ciclo     │
│                 │                 │   HU-18         │                 │ HU-10 Edición   │
│                 │                 │   Despliegue    │                 │ HU-11 Tareas    │
│                 │                 │   en la nube    │                 │ HU-12 Estados   │
│                 │                 │                 │                 │ HU-13 Portal    │
│                 │                 │                 │                 │ HU-14 Panel     │
│                 │                 │                 │                 │ HU-15 OpenAPI   │
│                 │                 │                 │                 │ HU-16 Pruebas   │
│                 │                 │                 │                 │ HU-17 CI        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## Trazabilidad historia → rama → commits

| Historia | Rama | Commits principales |
| --- | --- | --- |
| HU-01…HU-04 | `feat/autenticacion` | `feat(auth)`, `feat(api): exponer registro…` |
| HU-05…HU-07 | `feat/clientes` | `feat(clientes)`, `feat(api): exponer el padrón…` |
| HU-08…HU-10 | `feat/proyectos` | `feat(proyectos)`, `feat(api): exponer proyectos…` |
| HU-11…HU-12 | `feat/tareas` | `feat(tareas)`, `feat(api): exponer tareas…` |
| HU-13…HU-14 | `feat/interfaz` | `feat(panel)`, `feat(clientes)`, `feat(proyectos)`, `feat(tareas)` |
| HU-15 | `docs/documentacion` | `docs(api): publicar contrato OpenAPI…` |
| HU-16 | `test/integracion` | `test(db): cubrir persistencia real…` |
| HU-17 | `ci/github-actions` | `ci: ejecutar lint, tipos, pruebas y build…` |
| HU-18 | — | Pendiente de despliegue (requiere credenciales del proveedor). |
| BUG-05 | `bugfix/lint-commitlint` | `fix(config): corregir exportación anónima…` |

## Defectos del tablero

| Tarjeta | Estado | Rama / evidencia |
| --- | --- | --- |
| BUG-01 Fechas desfasadas por zona horaria | Hecho | `bugfix/fecha-desfasada-utc` (ver `docs/plan-de-pruebas.md`) |
| BUG-02 Bucle de redirecciones con cookie obsoleta | Hecho | `src/proxy.ts` + `docs/adr/0003-sesion-jwt-cookie.md` |
| BUG-03 Tests de integración borraban la base de desarrollo | Hecho | `scripts/prepare-test-db.mjs` + guarda en la suite |
| BUG-04 CSP bloqueaba React en desarrollo | Hecho | `next.config.ts` |
| BUG-05 Swagger UI bloqueado por CSP | Hecho | `public/docs/swagger-ui/` |
| BUG-06 Warning de ESLint en Commitlint | Hecho | `bugfix/lint-commitlint` |

## Cómo levantar el tablero en GitHub

1. Crear el repositorio y subir `main`.
2. En **Projects → New project → Board**, crear las cinco columnas.
3. Cargar las historias como issues (plantilla «Historia de usuario») y moverlas según el estado.
4. Vincular cada PR con su issue (`Closes #N`) para que el tablero se mueva automáticamente al mergear.
