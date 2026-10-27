# Arquitectura

## 1. Vista general

Nexo es una aplicación **full-stack en Next.js** (App Router) que sirve, en un mismo despliegue:

- **Interfaz web** renderizada en el servidor (React Server Components) con islas de interactividad (`"use client"`).
- **API REST** versionada en `/api/v1` mediante *route handlers*.
- **Protección de rutas** en el *proxy* (antiguo middleware) y en cada página/servicio.

```
┌──────────────────────────────────────────────────────────────┐
│                         Navegador                            │
│   HTML + RSC        fetch /api/v1/...        cookie `sesion` │
└───────────┬──────────────────┬──────────────────────┬────────┘
            │                  │                      │
┌───────────▼──────────────────▼──────────────────────▼────────┐
│                       Next.js (servidor)                     │
│                                                              │
│  proxy.ts ──► verifica JWT (optimista), redirige a /login     │
│                                                              │
│  app/(app)/*.tsx  ─────────────┐                             │
│  app/api/v1/**/route.ts ───────┤                             │
│                                ▼                             │
│                    modules/<m>/service.ts                    │
│                    (reglas de negocio + RBAC)                │
│                                │                             │
│                                ▼  interfaz (puerto)          │
│                    modules/<m>/repository.prisma.ts          │
└────────────────────────────────┬─────────────────────────────┘
                                 ▼
                        PostgreSQL (Prisma)
```

## 2. Capas y responsabilidades

| Capa | Ubicación | Responsabilidad | No debe |
| --- | --- | --- | --- |
| Presentación | `src/app/**/*.tsx`, `src/components/**` | Render, formularios, feedback al usuario. | Contener reglas de negocio ni consultas Prisma de escritura. |
| Transporte HTTP | `src/app/api/v1/**/route.ts`, `src/lib/http.ts` | Parsear y validar entrada, autenticar, traducir errores a HTTP. | Decidir permisos ni transiciones de estado. |
| Dominio | `src/modules/**/service.ts`, `policy.ts` | Reglas de negocio, RBAC, máquinas de estado, invariantes. | Conocer HTTP, cookies o Prisma. |
| Persistencia | `src/modules/**/repository.prisma.ts` | Traducir el puerto a consultas Prisma. | Validar reglas de negocio. |
| Infraestructura | `src/lib/{env,db,errors,rate-limit,format}.ts` | Configuración, cliente de base, utilidades transversales. | — |

El **dominio no importa** nada de Next.js ni de Prisma: sólo tipos. Por eso puede probarse con dobles en memoria.

## 3. Estructura de un módulo

```
modules/clientes/
├─ schema.ts             Zod: CrearClienteInput, ActualizarClienteInput, FiltroClientesInput
├─ types.ts              Cliente, DatosCliente, FiltroClientes y la interfaz ClienteRepository
├─ service.ts            crearClienteService(repo) → { listar, obtener, crear, actualizar, desactivar, reactivar }
├─ repository.prisma.ts  clienteRepository: ClienteRepository (adaptador)
├─ index.ts              composition root: crearClienteService(clienteRepository)
└─ service.test.ts       pruebas contra crearClienteRepositorioMemoria()
```

**Inyección de dependencias por función fábrica.** El servicio no importa el repositorio; lo recibe:

```ts
export function crearClienteService(repo: ClienteRepository) {
  async function crear(actor: Actor, datos: CrearClienteInput) {
    if (!puedeGestionarClientes(actor)) throw new ForbiddenError(...);
    // ...
    return repo.crear({ ...datos, cuit: datos.cuit ?? null });
  }
  return { crear, /* ... */ };
}
```

`index.ts` arma el grafo en un solo lugar:

```ts
export const clienteService = crearClienteService(clienteRepository);
```

## 4. Flujo de una petición (ejemplo real)

`PATCH /api/v1/proyectos/:id/estado` con `{ "estado": "EN_CURSO" }`:

1. **`proxy.ts`** verifica la firma del JWT de la cookie `sesion`. Si no hay sesión válida, redirige a `/login` y borra la cookie inválida.
2. **Route handler** (`app/api/v1/proyectos/[id]/estado/route.ts`):
   - `assertSameOrigin(request)` — mitigación CSRF.
   - `obtenerActor()` — revalida contra la base que el usuario exista y esté activo.
   - `parseJson(request, cambiarEstadoSchema)` — Zod valida el cuerpo.
3. **Servicio** (`proyectos/service.ts`):
   - `obtener(actor, id)` → 404 si no existe, 403 si el proyecto es de otra empresa.
   - `puedeGestionarProyectos(actor)` → 403 para `CLIENTE`.
   - `transicionPermitida(estadoActual, nuevo)` → 409 si la transición no existe.
   - `repo.cambiarEstado(id, nuevo)`.
4. **Repositorio Prisma** ejecuta el `UPDATE` y devuelve el proyecto con su cliente.
5. **Respuesta**: `200` con el proyecto, o el error traducido por `jsonError`.

## 5. Manejo de errores

- `src/lib/errors.ts` define `AppError` con `code`, `status` y `details` opcionales, más los subtipos `ValidationError` (422), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409).
- Los servicios lanzan **errores de dominio**, nunca respuestas HTTP.
- `withErrorHandling()` envuelve cada route handler: convierte errores de dominio, traduce códigos conocidos de Prisma (`P2002`, `P2025`, `P2003`) y devuelve `500` genérico con log en el servidor para cualquier otra excepción.
- La forma del error es siempre la misma (`{ error: { codigo, mensaje, detalles? } }`), lo que simplifica el frontend.

## 6. Interfaz de usuario

- **Server Components** por defecto: leen datos a través de los servicios. La única excepción es el panel, que ejecuta consultas de agregados (conteos y listados cortos) contra Prisma como *read model* de sólo lectura, sin reglas de negocio.
- **Client Components** acotados: formularios, botones de acción, paginación, toasts.
- `useApiForm` centraliza el ciclo de envío: `fetch` → mapeo de errores por campo → toast; los errores de validación se muestran junto al campo (`aria-invalid`, `#campo-error`).
- `ToastProvider` distingue éxito, advertencia y error.
- Tailwind 4 con tokens propios (`marca-600`, etc.) y layout responsive (sidebar en escritorio, encabezado compacto en móvil).

## 7. Autenticación y sesión

- `POST /api/v1/auth/login` valida credenciales con bcrypt y emite un JWT (HS256, `iss`/`aud`/`exp`) en la cookie `sesion`.
- La cookie es `HttpOnly` (inaccesible para JS), `SameSite=Lax`, `Secure` en producción, con expiración alineada al TTL.
- `obtenerActor()` se memoiza por request con `cache()` de React y **revalida contra la base**: una baja o cambio de rol impacta de inmediato, sin esperar el vencimiento del token.
- El proxy sólo hace verificación *optimista* (firma). No consulta la base porque corre en el edge en cada request; la autorización real siempre ocurre en el servidor.

## 8. Base de datos

- PostgreSQL con Prisma 7 y migraciones versionadas (`prisma migrate`).
- Modelo normalizado con FK explícitas e índices para los filtros reales.
- Baja lógica: `activo` + `eliminadoEn`; las consultas de listado excluyen inactivos salvo que se pida lo contrario.
- `Decimal(12,2)` para presupuesto y `Decimal(5,2)` para horas; el repositorio los mapea a `number` en el borde para no filtrar tipos de Prisma al dominio.

## 9. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre |
| --- | --- | --- |
| Unitaria | Vitest + repositorios en memoria (`src/test/fakes.ts`) | Reglas de negocio, RBAC, máquinas de estado, validaciones, hash y JWT. |
| Integración | Vitest + PostgreSQL real | Constraints, FK, transacciones, mapeo de Decimal, filtros y paginación. |
| Humo (manual) | Navegador | Flujos completos por rol, mensajes y estados de UI. |

Ver [`plan-de-pruebas.md`](plan-de-pruebas.md).

## 10. Decisiones clave

| Decisión | Alternativa descartada | Motivo | ADR |
| --- | --- | --- | --- |
| Next.js App Router full-stack | SPA + API separada | Un solo despliegue, RSC, menos superficie de error para un proyecto individual. | [0001](adr/0001-nextjs-app-router.md) |
| Puertos y adaptadores | Servicios acoplados a Prisma | Testeabilidad y sustitución de persistencia. | [0002](adr/0002-arquitectura-por-capas.md) |
| JWT en cookie HttpOnly | Sesiones en base / localStorage | Sin estado en el servidor y sin exposición a XSS. | [0003](adr/0003-sesion-jwt-cookie.md) |
| Prisma + migraciones | SQL a mano / `db push` | Tipado, historial reproducible y despliegue seguro. | [0004](adr/0004-prisma-postgresql.md) |
| Baja lógica | Borrado físico | Requisito de negocio: conservar historial. | [0005](adr/0005-baja-logica.md) |
| Swagger UI local | CDN de Swagger | CSP estricta y funcionamiento sin internet. | [0006](adr/0006-swagger-ui-local.md) |
| Zod compartido | Validación ad hoc por capa | Un único contrato para UI y API. | [0007](adr/0007-validacion-zod.md) |
