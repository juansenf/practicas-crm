# Bitácora de desarrollo

Registro cronológico de las sesiones de trabajo: objetivo, actividades, decisiones, problemas encontrados y tiempo estimado. Complementa el historial de commits y los PR del repositorio.

**Proyecto:** Nexo · Mini CRM de clientes, proyectos y tareas
**Autor:** Facundo Lemo
**Modalidad:** individual

---

## Sesión 1 — 2026-10-21 · Análisis y planificación (3 h)

**Objetivo:** comprender la consigna y definir alcance del MVP.

- Lectura y desglose de los requisitos de la Práctica Profesionalizante II.
- Elección del dominio: sistema de gestión para un estudio de desarrollo (Clientes → Proyectos → Tareas).
- Definición de roles: `ADMIN`, `OPERADOR`, `CLIENTE`.
- Borrador de historias de usuario y criterios de aceptación (`docs/backlog.md`).
- Identificación del conflicto entre la modalidad individual y criterios de la consigna que asumen equipo (revisión por pares, participación equilibrada). Se decide documentar la adaptación en `CONTRIBUTING.md` y consultarlo con la cátedra.

**Decisiones:** alcance acotado a tres entidades relacionadas con baja lógica; sin notificaciones por email ni adjuntos en esta etapa.

**Riesgos detectados:** el tiempo disponible y la necesidad de evidencias de proceso (Kanban, PRs) en un equipo de una persona.

---

## Sesión 2 — 2026-10-22 · Stack y esqueleto (4 h)

**Objetivo:** dejar el proyecto compilando con la arquitectura acordada.

- Creación del proyecto con `create-next-app` (Next.js 16, TypeScript, Tailwind 4, App Router).
- Instalación de dependencias: Prisma 7 + `@prisma/adapter-pg`, Zod, `jose`, `bcryptjs`, Vitest.
- Definición del modelo de datos en `prisma/schema.prisma`: enums (`Rol`, `EstadoProyecto`, `EstadoTarea`, `Prioridad`), entidades con baja lógica, FK e índices.
- Primera migración versionada (`20261027034445_init`).
- Configuración de `prisma.config.ts` (Prisma 7 no carga `.env` automáticamente).
- Seed con datos de demostración.

**Problema:** `prisma migrate dev` ya no ejecuta el seed ni `generate` en Prisma 7 → se agregaron scripts explícitos en `package.json`.

---

## Sesión 3 — 2026-10-23 · Núcleo del dominio (5 h)

**Objetivo:** implementar reglas de negocio desacopladas y probables.

- Definición del patrón de módulo: `schema` + `types` + `service` + `repository.prisma` + `index`.
- Implementación de `auth` (password, JWT, política RBAC, servicio, repositorio).
- Implementación de `clientes`, `proyectos` y `tareas` con sus máquinas de estado.
- `src/lib/`: `env` (validación con Zod), `db`, `errors`, `http`, `rate-limit`, `format`.
- Pruebas con repositorios en memoria (`src/test/fakes.ts`).

**Decisión:** los servicios reciben el repositorio por parámetro para poder testear sin base de datos (ADR 0002).

**Problema:** el import `server-only` rompía Vitest → alias a un módulo vacío en `vitest.config.mts`.

---

## Sesión 4 — 2026-10-24 · API REST (3 h)

**Objetivo:** exponer el dominio por HTTP con errores consistentes.

- Route handlers en `/api/v1` para auth, clientes, proyectos y tareas.
- `withErrorHandling` + `jsonError`: traducción uniforme de errores de dominio y de códigos Prisma (`P2002`, `P2025`, `P2003`).
- Verificación de `Origin` en operaciones de escritura (CSRF).
- Endpoints extra: `reactivar` (clientes) y `estado` (proyectos y tareas).

**Decisión:** la API y las páginas usan los mismos servicios, para que no haya divergencia de reglas.

---

## Sesión 5 — 2026-10-25 · Interfaz (6 h)

**Objetivo:** completar la UI responsive con feedback claro.

- Layout autenticado con navegación por rol y layout de autenticación.
- Panel con métricas, últimos proyectos y próximas tareas.
- Clientes: listado con búsqueda, filtros y paginación; alta; ficha con edición, baja y reactivación.
- Proyectos: listado, alta, detalle con cambio de estado, edición y baja.
- Tareas: listado global y por proyecto, alta, cambio de estado y baja.
- Componentes: `useApiForm` (manejo de errores por campo), toasts, paginación, etiquetas de estado.
- Estados vacíos y mensajes de error explícitos.

**Problema:** el formulario dentro de `<details>` no aparecía en el árbol de accesibilidad del navegador; se verificó que el DOM y los estilos estaban bien y se probó el envío por DOM.

---

## Sesión 6 — 2026-10-26 · Seguridad, pruebas y documentación de API (5 h)

**Objetivo:** cerrar requisitos de seguridad y calidad.

- Revisión OWASP y ajuste de cabeceras/CSP en `next.config.ts`.
- Fix de fechas: `formatFecha` con `timeZone: "UTC"` (BUG-01).
- Corrección del bucle de redirecciones con cookies obsoletas (BUG-02): el proxy dejó de redirigir rutas públicas con cookie presente; `/login` y `/registro` validan contra la base.
- `public/openapi.yaml` (OpenAPI 3.1) y Swagger UI servido localmente (ADR 0006).
- Pruebas: 47 unitarias + 6 de integración.
- Ajuste de ESLint para excluir el bundle de Swagger y el código generado.

**Aprendizaje:** `'unsafe-eval'` es necesario para React en desarrollo, pero nunca en producción.

---

## Sesión 7 — 2026-10-27 · Integración, CI y cierre documental (4 h)

**Objetivo:** dejar el repositorio listo para entregar.

- Detección de un problema grave: `prisma dev` ignora el nombre de base de la URL, por lo que las pruebas de integración borraban los datos de desarrollo (BUG-03). Solución: instancia aislada (`npx prisma dev -d -n test`) + guardas por contenido en `scripts/prepare-test-db.mjs` y en la suite.
- Verificación de build, lint, typecheck y 53 pruebas en verde.
- Historial de commits organizado por ramas (`feature/`, `bugfix/`, `docs/`, `ci/`) con merges `--no-ff` y mensajes validados con Commitlint.
- Documentación: README, arquitectura, ADR, backlog, tablero Kanban, plan de pruebas, seguridad, despliegue y contribución.
- Configuración de Commitlint y GitHub Actions.
- Preparación del historial de commits por rama (`feature/`, `bugfix/`, `docs/`, `ci/`).

**Pendiente:** creación del repositorio remoto, protección de `main` y despliegue en Vercel + Neon.

---

## Resumen de tiempo

| Sesión | Fecha | Horas |
| --- | --- | :---: |
| 1 | 2026-10-21 | 3 |
| 2 | 2026-10-22 | 4 |
| 3 | 2026-10-23 | 5 |
| 4 | 2026-10-24 | 3 |
| 5 | 2026-10-25 | 6 |
| 6 | 2026-10-26 | 5 |
| 7 | 2026-10-27 | 4 |
| **Total** | | **30** |

## Decisiones registradas

| Fecha | Decisión | Documento |
| --- | --- | --- |
| 2026-10-22 | Next.js App Router como framework full-stack | [ADR 0001](adr/0001-nextjs-app-router.md) |
| 2026-10-23 | Arquitectura por capas con puertos y adaptadores | [ADR 0002](adr/0002-arquitectura-por-capas.md) |
| 2026-10-23 | JWT en cookie `HttpOnly` | [ADR 0003](adr/0003-sesion-jwt-cookie.md) |
| 2026-10-22 | Prisma 7 + PostgreSQL con migraciones versionadas | [ADR 0004](adr/0004-prisma-postgresql.md) |
| 2026-10-22 | Baja lógica en las tres entidades de negocio | [ADR 0005](adr/0005-baja-logica.md) |
| 2026-10-26 | Swagger UI servido localmente | [ADR 0006](adr/0006-swagger-ui-local.md) |
| 2026-10-24 | Validación compartida con Zod | [ADR 0007](adr/0007-validacion-zod.md) |

## Historial de defectos

| ID | Fecha | Descripción | Estado |
| --- | --- | --- | --- |
| BUG-01 | 2026-10-26 | Fechas mostradas un día antes por zona horaria | Corregido |
| BUG-02 | 2026-10-26 | Bucle de redirecciones con cookie de usuario eliminado | Corregido |
| BUG-03 | 2026-10-27 | Las pruebas de integración borraban la base de desarrollo | Corregido |
| BUG-04 | 2026-10-26 | CSP bloqueaba React en desarrollo | Corregido |
| BUG-05 | 2026-10-26 | Swagger UI bloqueado por CSP | Corregido |
| BUG-06 | 2026-10-27 | Warning de ESLint por export anónimo en Commitlint | Corregido |
