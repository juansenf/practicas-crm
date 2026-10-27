# Plan de pruebas

## 1. Objetivo

Verificar que el sistema **Nexo** cumple sus reglas de negocio críticas, que el control de acceso es correcto y que la aplicación se comporta de forma segura y consistente en los flujos principales.

## 2. Alcance

**Incluido**

- Autenticación, sesión y cierre de sesión.
- RBAC y aislamiento de datos entre empresas (IDOR).
- CRUD con baja lógica de clientes, proyectos y tareas.
- Máquinas de estado de proyectos y tareas.
- Validaciones de entrada (frontend y backend).
- Integridad de datos en PostgreSQL (constraints, FK, transacciones).
- Mensajes y notificaciones al usuario.

**Excluido**

- Pruebas de carga y rendimiento (se documentan como trabajo futuro).
- Compatibilidad con navegadores antiguos.
- Pruebas de penetración formales.

## 3. Estrategia

| Nivel | Herramienta | Objetivo | Velocidad |
| --- | --- | --- | --- |
| Unitario | Vitest + repositorios en memoria | Reglas de negocio puras, RBAC, máquinas de estado, utilidades de seguridad. | ~5 s |
| Integración | Vitest + PostgreSQL real | Constraints, FK, transacciones, mapeo de tipos, filtros y paginación. | ~8 s |
| Humo (manual, guiado por navegador) | Navegador + API | Flujos completos por rol y verificación de UI/UX. | ~20 min |

**Criterio de entrada:** build compilando y base migrada.
**Criterio de salida:** 100 % de las pruebas automatizadas en verde, sin errores 500 en los flujos de humo y todos los criterios de aceptación de las historias `Alta` verificados.

## 4. Entorno y datos

- Base de integración dedicada (`TEST_DATABASE_URL`), aislada de la de desarrollo.
- Datos de demostración del seed: 3 usuarios (uno por rol), 2 clientes, 3 proyectos y 4 tareas.
- Para el humo se crean datos temporales y se eliminan al finalizar.

## 5. Casos de prueba automatizados

### 5.1 Autenticación y sesión — `src/modules/auth/`

| ID | Caso | Tipo | Resultado esperado |
| --- | --- | --- | --- |
| AU-01 | Login con credenciales válidas | Unitario | Devuelve el `Actor` con rol y `clienteId`. |
| AU-02 | Contraseña incorrecta | Unitario | `401` con mensaje genérico. |
| AU-03 | Email inexistente | Unitario | `401` idéntico al caso anterior (no revela existencia). |
| AU-04 | Cuenta deshabilitada | Unitario | `403`. |
| AU-05 | Exceso de intentos (5/15 min) | Unitario | `401` ×2 y luego `429`. |
| AU-06 | Registro crea empresa + usuario `CLIENTE` | Unitario | `clienteId` asignado y contraseña hasheada. |
| AU-07 | Registro con email repetido | Unitario | `409` con detalle en `email`. |
| AU-08 | Hash bcrypt distinto del texto plano y con salt | Unitario | Nunca coincide; dos hashes difieren. |
| AU-09 | Verificación de contraseña correcta/incorrecta | Unitario | `true` / `false`. |
| AU-10 | Firma y verificación de JWT | Unitario | Payload preservado. |
| AU-11 | Token con formato inválido | Unitario | `null`. |
| AU-12 | Token manipulado | Unitario | `null`. |
| AU-13 | Token firmado con otro secreto | Unitario | `null`. |
| AU-14 | Rate limiter: cupo, ventana, claves, reinicio | Unitario | Comportamiento exacto por reloj inyectado. |

### 5.2 Clientes — `src/modules/clientes/service.test.ts`

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| CL-01 | Alta con datos válidos | Cliente activo, email normalizado. |
| CL-02 | Email duplicado | `409` con `details.email`. |
| CL-03 | CUIT duplicado | `409` con `details.cuit`. |
| CL-04 | Listado por rol `CLIENTE` | `403`. |
| CL-05 | Baja con proyectos activos | `409`. |
| CL-06 | Baja sin proyectos | `activo=false`, registro conservado. |
| CL-07 | `CLIENTE` accede a otra empresa | `403`. |

### 5.3 Proyectos — `src/modules/proyectos/service.test.ts`

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| PR-01 | Transiciones válidas del ciclo de vida | Permitidas. |
| PR-02 | Transiciones inválidas y estados terminales | Rechazadas. |
| PR-03 | Alta con cliente dado de baja | `409` con `details.clienteId`. |
| PR-04 | Alta correcta | `creadoPorId` = actor. |
| PR-05 | Cambio de estado no permitido | `409`. |
| PR-06 | Edición de proyecto finalizado | `409`. |
| PR-07 | Filtro forzado por `CLIENTE` | El servicio ignora el `clienteId` enviado. |
| PR-08 | Baja con tareas en progreso | `409`. |

### 5.4 Tareas — `src/modules/tareas/service.test.ts`

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| TA-01 | Transiciones válidas | Permitidas. |
| TA-02 | Transiciones inválidas | Rechazadas. |
| TA-03 | Alta en proyecto vigente | Nace `PENDIENTE`. |
| TA-04 | Alta en proyecto finalizado | `409`. |
| TA-05 | Alta en proyecto inexistente/dado de baja | `409` con `details.proyectoId`. |
| TA-06 | Responsable no interno o inactivo | `409` con `details.responsableId`. |
| TA-07 | Cambio de estado inválido | `409`. |
| TA-08 | Modificación en proyecto cancelado | `409`. |
| TA-09 | `CLIENTE` intenta crear tarea | `403`. |
| TA-10 | Listado de `CLIENTE` | Sólo tareas de su empresa. |
| TA-11 | Baja lógica de tarea | `activo=false`. |

### 5.5 Persistencia — `src/test/integracion/repositories.integration.test.ts`

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| DB-01 | Alta de cliente y búsqueda por email | Se recupera el mismo registro, activo. |
| DB-02 | Email duplicado | Error `P2002` (unique constraint). |
| DB-03 | Proyecto con `Decimal(12,2)` | Se mapea a `1234.56` y trae el cliente. |
| DB-04 | Borrado físico de cliente con proyectos | Error `P2003` (FK `Restrict`). |
| DB-05 | Baja de proyecto | Sus tareas quedan inactivas con `eliminadoEn` en la misma transacción. |
| DB-06 | Listado de tareas | Excluye inactivas y filtra por proyecto. |

## 6. Casos de prueba manuales (humo)

| ID | Flujo | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| SM-01 | Login `ADMIN` | `/login` con `admin@nexo.local` | Panel con métricas de toda la cartera. |
| SM-02 | Alta de cliente | Clientes → Nuevo cliente → completar y guardar | Toast de éxito y cliente en el listado. |
| SM-03 | Validación de duplicado | Repetir el email anterior | Toast de error + mensaje bajo el campo, `aria-invalid=true`. |
| SM-04 | Alta de proyecto | Proyectos → Nuevo proyecto | Toast de éxito y proyecto en estado `PLANIFICADO`. |
| SM-05 | Transición de proyecto | Detalle → Cambiar estado → `EN_CURSO` | Toast con el nuevo estado y etiqueta actualizada. |
| SM-06 | Alta de tarea | Detalle de proyecto → Agregar tarea | Tarea visible con estado `Pendiente`. |
| SM-07 | Transición de tarea | Fila → `En progreso` | Toast y estado actualizado tras recargar. |
| SM-08 | Login `CLIENTE` | Logout → login `cliente@nexo.local` | Navegación sin «Clientes»; sólo sus proyectos. |
| SM-09 | IDOR por URL | Abrir `/proyectos/{id de otra empresa}` | Redirección al panel. |
| SM-10 | IDOR por API | `GET /api/v1/clientes` autenticado como `CLIENTE` | `403` con código `SIN_PERMISOS`. |
| SM-11 | Ruta privada sin sesión | Abrir `/dashboard` en incógnito | Redirección a `/login?redirect=/dashboard`. |
| SM-12 | Logout | Cerrar sesión | Cookie eliminada; rutas privadas redirigen a login. |
| SM-13 | Documentación | Abrir `/docs` | Swagger UI con las 22 operaciones y sin errores de CSP. |
| SM-14 | Responsive | Redimensionar a 375 px | Sidebar reemplazada por encabezado; tablas con scroll horizontal. |

## 7. Defectos encontrados y corregidos

| ID | Descripción | Detección | Corrección |
| --- | --- | --- | --- |
| BUG-01 | Las fechas de negocio se mostraban un día antes en husos negativos (`14/05` en lugar de `15/05`). | Humo (SM-01) | `formatFecha` formatea con `timeZone: "UTC"`, coherente con cómo se guardan (medianoche UTC). |
| BUG-02 | Bucle de redirecciones (`ERR_TOO_MANY_REDIRECTS`) con una cookie válida de un usuario ya eliminado: `/dashboard → /login → /dashboard`. | Humo (SM-11) | El proxy ya no redirige rutas públicas cuando hay cookie; `/login` y `/registro` validan contra la base. Además se borra la cookie si el token no verifica. |
| BUG-03 | Las pruebas de integración borraban datos de desarrollo porque `prisma dev` ignora el nombre de base de la URL. | Ejecución de la suite | Instancia aislada para tests + guardas por contenido en `db:test:prepare` y en la propia suite. |
| BUG-04 | CSP bloqueaba `eval()` de React en desarrollo. | Humo (consola) | `'unsafe-eval'` sólo en `NODE_ENV !== "production"`. |
| BUG-05 | Swagger UI no cargaba por la CSP (script de CDN). | Humo (SM-13) | Bundle servido desde `public/docs/swagger-ui/`. |

## 8. Ejecución

```bash
npm run lint        # 0 errores, 0 warnings
npm run typecheck   # sin errores
npm test            # 53 pruebas, 8 archivos
npm run build       # build de producción correcto
```

Resultado de la última ejecución completa:

```
Test Files  8 passed (8)
     Tests  53 passed (53)
```

## 9. Riesgos y trabajo futuro

- **Rate limit en memoria**: en un despliegue serverless con múltiples instancias el límite es *best-effort*. Mitigación futura: Redis/Upstash.
- **Sin pruebas E2E automatizadas**: el humo es manual. Mitigación futura: Playwright.
- **Cobertura**: se priorizó cubrir reglas de negocio; los componentes de UI no tienen pruebas unitarias.
- **Carga**: no se evaluó comportamiento con volúmenes altos.
