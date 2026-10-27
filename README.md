# Nexo · Mini CRM de clientes, proyectos y tareas

[![CI](https://github.com/juansenf/practicas-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/juansenf/practicas-crm/actions/workflows/ci.yml)

Aplicación web para gestionar la relación con clientes de un estudio de desarrollo: **Clientes → Proyectos → Tareas**, con autenticación, control de acceso por roles, CRUD completo con baja lógica, validación en frontend y backend, y despliegue en la nube.

> Proyecto integrador de **Práctica Profesionalizante II** — Tecnicatura Superior en Desarrollo de Software (2026).

| Enlace | URL |
| --- | --- |
| Aplicación en producción | <https://practicas-crm.vercel.app> |
| Repositorio | <https://github.com/juansenf/practicas-crm> |
| Tablero Kanban | <https://github.com/users/juansenf/projects/1> |
| Documentación de la API | <https://practicas-crm.vercel.app/docs> |

---

## Índice

- [Alcance funcional](#alcance-funcional)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Usuarios de demostración](#usuarios-de-demostración)
- [API REST y documentación](#api-rest-y-documentación)
- [Pruebas](#pruebas)
- [Seguridad](#seguridad)
- [Despliegue](#despliegue)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación complementaria](#documentación-complementaria)

---

## Alcance funcional

| Módulo | Funcionalidad |
| --- | --- |
| **Autenticación** | Registro público de clientes, login, logout y sesión persistente. Hash bcrypt (coste 12), JWT HS256 en cookie `HttpOnly`, rate limit de login. |
| **Clientes** | Alta, consulta, edición, baja lógica y reactivación. Búsqueda por nombre/email/CUIT y filtro por estado. |
| **Proyectos** | Asociados a un cliente. Ciclo de vida con transiciones válidas (`PLANIFICADO → EN_CURSO → PAUSADO → FINALIZADO`, con `CANCELADO` como salida). Presupuesto y fechas. |
| **Tareas** | Asociadas a un proyecto, con prioridad, responsable interno, fecha límite y horas estimadas. Cambio de estado con máquina de estados. |
| **Portal del cliente** | El rol `CLIENTE` ve únicamente los proyectos y tareas de su propia empresa (filtrado en el servidor, no en la UI). |
| **Panel** | Métricas de cartera (clientes activos, proyectos en curso, tareas abiertas), últimos proyectos y próximas tareas. |

### Roles (RBAC)

| Acción | ADMIN | OPERADOR | CLIENTE |
| --- | :---: | :---: | :---: |
| Gestionar clientes | ✅ | ✅ | ❌ |
| Gestionar proyectos y tareas | ✅ | ✅ | ❌ |
| Ver todos los proyectos | ✅ | ✅ | ❌ |
| Ver proyectos y tareas de su empresa | ✅ | ✅ | ✅ |
| Registrarse desde el sitio público | — | — | ✅ |

La autorización se aplica **en el servicio** (`src/modules/auth/policy.ts`), no en la interfaz: aunque se invoque la API directamente, las reglas se respetan.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [Next.js 16.4.3](https://nextjs.org) (App Router, Server Components, Turbopack) |
| UI | React 19.3, TypeScript 5, Tailwind CSS 4 |
| Base de datos | PostgreSQL 16+ |
| ORM | Prisma 7.10.1 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Validación | Zod 4 (esquemas compartidos entre formularios y API) |
| Autenticación | `jose` (JWT HS256) + `bcryptjs` (coste 12) |
| Pruebas | Vitest 5 (unitarias + integración con PostgreSQL real) |
| Calidad | ESLint 9 (`eslint-config-next`), TypeScript estricto, Commitlint |
| CI/CD | GitHub Actions · despliegue en Vercel + Neon |

---

## Arquitectura

Arquitectura en capas con dependencias apuntando hacia el dominio (adaptación de *Clean Architecture* a Next.js):

```
app/ (route handlers y páginas)
   │  valida HTTP, traduce errores, arma la cookie
   ▼
modules/<módulo>/service.ts        ← reglas de negocio puras (sin Prisma, sin HTTP)
   │  depende de una interfaz (puerto), no de una implementación
   ▼
modules/<módulo>/types.ts          ← interfaz del repositorio + tipos del dominio
   ▲
   │  implementada por
modules/<módulo>/repository.prisma.ts  ← adaptador de persistencia
```

Cada módulo (`auth`, `clientes`, `proyectos`, `tareas`) expone:

- `schema.ts`: contratos de entrada con Zod.
- `types.ts`: tipos del dominio y la **interfaz** del repositorio.
- `service.ts`: reglas de negocio (transiciones de estado, permisos, unicidad).
- `repository.prisma.ts`: implementación del puerto con Prisma.
- `index.ts`: *composition root* que inyecta el repositorio en el servicio.
- `service.test.ts`: pruebas del servicio contra un repositorio en memoria.

Como el servicio recibe el repositorio por parámetro (`crearClienteService(repo)`), las pruebas de reglas de negocio corren en milisegundos sin base de datos. En producción, `index.ts` inyecta el repositorio Prisma.

**Beneficios concretos**

- Cambiar de ORM o agregar caché implica escribir otro adaptador, sin tocar las reglas.
- Los errores de negocio son tipos (`NotFoundError`, `ConflictError`, `ForbiddenError`) que `src/lib/http.ts` traduce a HTTP en un único lugar.
- Las páginas y los route handlers comparten el mismo servicio, por lo que la UI y la API nunca divergen.

Detalle completo en [`docs/arquitectura.md`](docs/arquitectura.md) y en los [ADR](docs/adr/).

---

## Modelo de datos

```
Cliente 1 ──── * Proyecto 1 ──── * Tarea
   │                                 │
   │ 1                               │ *
   └────── 1 Usuario (rol CLIENTE)   └── 1 Usuario (responsable)
```

- **Baja lógica** en `Cliente`, `Proyecto` y `Tarea`: `activo` + `eliminadoEn`. El historial nunca se pierde.
- **Claves foráneas con política explícita**: `Restrict` (cliente con proyectos), `Cascade` (tareas de un proyecto), `SetNull` (usuario dado de baja).
- **Índices** para los filtros reales: `(activo, nombre)`, `(clienteId, estado)`, `(proyectoId, estado)`, `(responsableId, estado)`, `(rol, activo)`.
- **Migraciones versionadas** en `prisma/migrations/` (nunca `db push`).

El esquema completo está en [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Puesta en marcha

### Requisitos

- Node.js 22 o superior
- npm 10+
- PostgreSQL (local, Docker, o el servidor local que trae Prisma)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Generá un secreto real para `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 3. Levantar PostgreSQL

Opción A — servidor local de Prisma (sin instalar nada):

```bash
npm run db:local        # queda en segundo plano
```

Copia la URL TCP que informa el comando (o `npx prisma dev ls`) en `DATABASE_URL`.

Opción B — Docker:

```bash
docker run --name nexo-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=practicas_crm \
  -p 5432:5432 -d postgres:16
```

### 4. Aplicar migraciones y datos de demostración

```bash
npm run db:deploy       # aplica prisma/migrations
npm run db:seed         # carga usuarios, clientes, proyectos y tareas de ejemplo
```

### 5. Arrancar la aplicación

```bash
npm run dev
```

- Aplicación: <http://localhost:3000>
- Documentación de la API: <http://localhost:3000/docs>

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | Cadena de conexión de PostgreSQL. |
| `AUTH_SECRET` | ✅ | Secreto para firmar los JWT (mínimo 32 caracteres). |
| `TEST_DATABASE_URL` | — | Base **dedicada** a las pruebas de integración. Si falta, esos tests se omiten. |
| `SESSION_TTL_SECONDS` | — | Vida de la sesión en segundos (por defecto `28800`, 8 h). |

El archivo `.env` está en `.gitignore`; sólo se versiona `.env.example`. Las variables se validan al arrancar (`src/lib/env.ts`) y la aplicación falla rápido si falta algo.

---

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con Turbopack. |
| `npm run build` | Build de producción (incluye chequeo de tipos). |
| `npm start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Pruebas unitarias y de integración. |
| `npm run test:watch` | Vitest en modo interactivo. |
| `npm run test:coverage` | Cobertura con V8. |
| `npm run lint:commits` | Valida los mensajes de commit contra Conventional Commits. |
| `npm run db:local` | Servidor PostgreSQL local de Prisma. |
| `npm run db:migrate` | Crea una migración nueva en desarrollo. |
| `npm run db:deploy` | Aplica migraciones pendientes (producción/CI). |
| `npm run db:seed` | Carga datos de demostración. |
| `npm run db:studio` | Prisma Studio. |
| `npm run db:generate` | Regenera el cliente Prisma. |
| `npm run db:test:prepare` | Prepara la base de integración (crea + migra). |

---

## Usuarios de demostración

| Rol | Email | Contraseña |
| --- | --- | --- |
| ADMIN | `admin@nexo.local` | `Demo12345!` |
| OPERADOR | `operador@nexo.local` | `Demo12345!` |
| CLIENTE | `cliente@nexo.local` | `Demo12345!` |

> Las cuentas están activas **a propósito** en la demo pública para que la cátedra pueda probar cada rol. En un entorno real se eliminan o se rotan sus contraseñas antes de publicar (ver [`docs/seguridad.md`](docs/seguridad.md#6-checklist-de-revisión-previa-a-producción)).

---

## API REST y documentación

- **Contrato OpenAPI 3.1**: [`public/openapi.yaml`](public/openapi.yaml)
- **Consola interactiva**: `/docs` (Swagger UI servido localmente, sin CDN)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/v1/auth/registro` | Registro de cliente (crea empresa + usuario). |
| `POST` | `/api/v1/auth/login` | Inicio de sesión (setea cookie). |
| `POST` | `/api/v1/auth/logout` | Cierre de sesión. |
| `GET` | `/api/v1/auth/me` | Usuario autenticado. |
| `GET/POST` | `/api/v1/clientes` | Listado paginado / alta. |
| `GET/PATCH/DELETE` | `/api/v1/clientes/{id}` | Ficha, edición y baja lógica. |
| `POST` | `/api/v1/clientes/{id}/reactivar` | Reactivación. |
| `GET/POST` | `/api/v1/proyectos` | Listado paginado / alta. |
| `GET/PATCH/DELETE` | `/api/v1/proyectos/{id}` | Detalle, edición y baja lógica. |
| `PATCH` | `/api/v1/proyectos/{id}/estado` | Transición de estado. |
| `GET/POST` | `/api/v1/tareas` | Listado paginado / alta. |
| `GET/PATCH/DELETE` | `/api/v1/tareas/{id}` | Detalle, edición y baja lógica. |
| `PATCH` | `/api/v1/tareas/{id}/estado` | Transición de estado. |

Formato uniforme de errores:

```json
{
  "error": {
    "codigo": "DATOS_INVALIDOS",
    "mensaje": "Revisá los datos ingresados.",
    "detalles": { "email": ["Ingresá un email válido."] }
  }
}
```

---

## Pruebas

```bash
npm test                 # unitarias + integración (si TEST_DATABASE_URL está definida)
npm run test:coverage    # con reporte de cobertura
```

- **53 pruebas** en 8 archivos:
  - Reglas de negocio de clientes, proyectos, tareas y autenticación.
  - Máquinas de estado, permisos por rol e IDOR.
  - Hash de contraseñas, firma/verificación de JWT, rate limiter.
  - Integración contra PostgreSQL real: constraints, FK `Restrict`, baja lógica en transacción, mapeo `Decimal → number`.

### Preparar la base de integración

Las pruebas de integración **borran las tablas**, por lo que requieren una base dedicada:

```bash
# Con `prisma dev`, una instancia aparte (aislada de la de desarrollo):
npx prisma dev -d -n test
# Copiá el puerto TCP que informa `npx prisma dev ls` en TEST_DATABASE_URL

npm run db:test:prepare
npm test
```

`db:test:prepare` se niega a continuar si detecta los usuarios del seed, para no destruir datos de desarrollo. Ese mismo control existe dentro de la suite.

Plan de pruebas detallado: [`docs/plan-de-pruebas.md`](docs/plan-de-pruebas.md).

---

## Seguridad

Resumen de las mitigaciones implementadas (detalle en [`docs/seguridad.md`](docs/seguridad.md)):

| Riesgo (OWASP Top 10) | Mitigación |
| --- | --- |
| A01 Broken Access Control | RBAC en servicios + filtrado por `clienteId` en el servidor; sin confiar en el cliente. |
| A02 Cryptographic Failures | bcrypt coste 12, JWT HS256 con secreto de 32+ bytes, cookie `HttpOnly`/`SameSite=Lax`/`Secure` en producción. |
| A03 Injection | Prisma (consultas parametrizadas) + validación Zod de toda entrada. |
| A04 Insecure Design | Máquinas de estado explícitas, reglas de negocio centralizadas y probadas. |
| A05 Security Misconfiguration | Cabeceras de seguridad y CSP en `next.config.ts`; sin secretos en el código. |
| A07 Auth Failures | Rate limit 5/15 min por email, hash de relleno para evitar enumeración de cuentas, mensajes genéricos. |
| A08 Data Integrity | Migraciones versionadas, constraints únicos y FK en la base. |
| A09 Logging Failures | Errores no controlados registrados en el servidor y respuesta genérica al cliente. |
| CSRF | `SameSite=Lax` + verificación de `Origin` en peticiones que mutan estado. |
| XSS | React escapa por defecto, CSP sin `unsafe-eval` en producción. |

---

## Despliegue

**Aplicación en producción:** https://practicas-crm.vercel.app

| Componente | Proveedor | Detalle |
| --- | --- | --- |
| Aplicación | Vercel | Next.js 16, HTTPS gestionado y variables de entorno cifradas. |
| Base de datos | Neon | PostgreSQL 18, región `aws-sa-east-1`, migraciones versionadas. |
| CI/CD | GitHub Actions · Vercel | Lint, tipos, build, pruebas con PostgreSQL y Commitlint. Cada merge a `main` dispara el despliegue automático en Vercel. |

**Tablero Kanban:** <https://github.com/users/juansenf/projects/1>

El repositorio está **vinculado al proyecto de Vercel** (*Production Branch*: `main`), así que cada push a `main` (es decir, cada PR mergeado) compila y publica solo. Guía paso a paso en [`docs/despliegue.md`](docs/despliegue.md). Resumen:

1. Crear una base PostgreSQL en **Neon** y copiar la connection string.
2. Importar el repositorio en **Vercel** (GitHub App instalada sobre `juansenf/practicas-crm`).
3. Configurar `DATABASE_URL`, `AUTH_SECRET` y `SESSION_TTL_SECONDS` en el proyecto de Vercel.
4. El script `vercel-build` aplica `prisma migrate deploy` antes del build.
5. Verificar `/docs` y el flujo de login en la URL pública.

---

## Estructura del repositorio

```
prisma/
  schema.prisma            Modelo de datos
  migrations/              Migraciones versionadas
  seed.ts                  Datos de demostración
scripts/
  prepare-test-db.mjs      Prepara la base de integración
src/
  app/
    (app)/                 Páginas autenticadas (panel, clientes, proyectos, tareas)
    (auth)/                Login y registro
    api/v1/                Route handlers de la API
    docs/                  Swagger UI
  components/              UI reutilizable (toast, paginación, formularios)
  lib/                     Env, db, errores, HTTP, formato, rate limit
  modules/
    auth/ clientes/ proyectos/ tareas/ usuarios/
  test/                    Fakes, setup y pruebas de integración
  proxy.ts                 Verificación optimista de sesión (ex middleware)
public/
  openapi.yaml             Contrato OpenAPI 3.1
  docs/swagger-ui/         Bundle local de Swagger UI
docs/                      ADR, backlog, bitácora, plan de pruebas, despliegue
.github/                   CI, plantillas de issues y PR
```

---

## Documentación complementaria

- [Arquitectura y decisiones](docs/arquitectura.md)
- [ADR (Architecture Decision Records)](docs/adr/)
- [Backlog e historias de usuario](docs/backlog.md)
- [Tablero Kanban](docs/kanban.md)
- [Bitácora de desarrollo](docs/bitacora.md)
- [Plan de pruebas](docs/plan-de-pruebas.md)
- [Seguridad](docs/seguridad.md)
- [Despliegue](docs/despliegue.md)
- [Guía de contribución](CONTRIBUTING.md)
