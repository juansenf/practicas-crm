# Seguridad

Documento de referencia sobre las amenazas consideradas y las mitigaciones implementadas. Se alinea con **OWASP Top 10 (2021)** y con criterios de **OWASP ASVS** donde aplica.

## 1. Superficie de ataque

| Componente | Exposición |
| --- | --- |
| Formularios web | Entrada de usuario no confiable (cliente, proyecto, tarea, login). |
| API REST `/api/v1` | Accesible directamente; debe aplicar las mismas reglas que la UI. |
| Cookie de sesión | Vector principal de secuestro si no se protege. |
| Base de datos | Sólo accesible desde el servidor con credenciales de entorno. |
| Endpoint de login | Vector de fuerza bruta y enumeración de cuentas. |
| `/docs` | Público, sin datos sensibles. |

## 2. Mapa OWASP Top 10

### A01 — Broken Access Control

- RBAC centralizado en `src/modules/auth/policy.ts`; los servicios lo aplican, no la UI.
- El rol `CLIENTE` se filtra **en el servidor** por `clienteId` (`listar` de proyectos y tareas), ignorando cualquier `clienteId` que envíe el cliente.
- `obtener()` de cada entidad valida pertenencia antes de devolver datos (previene IDOR).
- Las páginas vuelven a validar el rol: `/clientes` redirige al panel si el actor no es interno.
- El proxy sólo verifica la firma del JWT para navegación; **no** es la autorización.

### A02 — Cryptographic Failures

- Contraseñas con `bcryptjs`, coste 12, salt por contraseña; nunca se almacenan en claro ni se loguean.
- Límite de 72 caracteres en la contraseña (truncamiento de bcrypt) validado en el esquema.
- JWT firmado con HS256 y `AUTH_SECRET` de 32+ caracteres validado al arrancar.
- Cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `path=/`.
- Sin datos sensibles en el token (sólo id, nombre, rol y `clienteId`).

### A03 — Injection

- Todas las consultas pasan por Prisma (parametrizadas); no hay SQL concatenado.
- Toda entrada se valida y normaliza con Zod antes de llegar al repositorio.
- Los parámetros de búsqueda se validan con `parseQuery` (tipos, longitudes, enums).
- La salida se escapa por React (sin `dangerouslySetInnerHTML`).

### A04 — Insecure Design

- Máquinas de estado explícitas y probadas para proyectos y tareas.
- Invariantes de negocio en el dominio: no crear tareas en proyectos cerrados, no dar de baja clientes con proyectos activos, no editar proyectos finalizados.
- Baja lógica con auditoría (`eliminadoEn`).

### A05 — Security Misconfiguration

Cabeceras definidas en `next.config.ts`:

| Cabecera | Valor |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`; `'unsafe-eval'` sólo en desarrollo. |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Además: `.env` fuera del repositorio, `.env.example` versionado, sin secretos hardcodeados, generación del cliente Prisma fuera de git.

### A06 — Vulnerable and Outdated Components

- Dependencias acotadas por versión en `package.json` + `package-lock.json` versionado.
- `npm audit` sin vulnerabilidades conocidas al momento de la entrega.
- `swagger-ui-dist` se actualiza manualmente copiando el bundle a `public/docs/swagger-ui/`.

### A07 — Identification and Authentication Failures

- Rate limit de login: 5 intentos por email cada 15 minutos (en memoria, *best-effort* documentado).
- Hash de relleno cuando el email no existe, para igualar tiempos de respuesta.
- Mensaje genérico «Email o contraseña incorrectos.» en todos los fallos de credenciales.
- Cuentas deshabilitadas rechazadas tanto en login como en `obtenerActor()`.
- Registro público limitado al rol `CLIENTE` (no se puede autoasignar `ADMIN`).

### A08 — Software and Data Integrity Failures

- Migraciones versionadas; no se usa `db push` en producción.
- Constraints de unicidad (`email`, `cuit`) y claves foráneas con política explícita.
- CI valida lint, tipos, tests y build antes de mergear.

### A09 — Security Logging and Monitoring Failures

- Los errores no controlados se registran en el servidor (`console.error("[api] error no controlado")`) y al cliente se le devuelve un mensaje genérico con código `ERROR_INTERNO`.
- Los errores de negocio esperados no se consideran incidentes y no se loguean.
- **Pendiente**: logs estructurados y alertas en el proveedor (trabajo futuro).

### A10 — Server-Side Request Forgery

- La aplicación no realiza peticiones salientes a URLs provistas por el usuario.
- Prisma no expone endpoints que acepten URLs.

## 3. CSRF

- Cookie `SameSite=Lax`: no se envía en peticiones cruzadas de escritura (POST/PATCH/DELETE).
- Verificación adicional de `Origin` en las peticiones que mutan estado (`assertSameOrigin`), comparando con el `Host`.
- La API sólo acepta JSON (`content-type: application/json`), lo que impide el envío desde un `<form>` tradicional.

## 4. XSS

- React escapa el contenido interpolado.
- No se usa `dangerouslySetInnerHTML` en la aplicación.
- La CSP restringe scripts al propio origen; en producción no se permite `eval`.
- Las entradas se muestran como texto, nunca como HTML.

## 5. Gestión de secretos

| Secreto | Dónde vive | Rotación |
| --- | --- | --- |
| `AUTH_SECRET` | `.env` local / variables del proveedor | Rotar invalida todas las sesiones. |
| `DATABASE_URL` | `.env` local / variables del proveedor | Depende del proveedor. |

- `.gitignore` excluye `.env*`.
- No hay credenciales en el código, en los tests ni en la documentación (las de demo son locales y están marcadas como tales).
- El seed usa las credenciales de demostración sólo para desarrollo.

## 6. Checklist de revisión previa a producción

- [ ] `AUTH_SECRET` distinto del valor de ejemplo y de al menos 32 bytes.
- [ ] `DATABASE_URL` apunta a la base de producción con SSL.
- [ ] `NODE_ENV=production` (cookie `Secure`, CSP sin `unsafe-eval`).
- [ ] Usuarios de demostración eliminados o con contraseñas cambiadas.
- [ ] Migraciones aplicadas con `prisma migrate deploy`.
- [ ] `/docs` accesible y sin errores de CSP.
- [ ] Rate limit verificado manualmente (6 intentos fallidos → `429`).
- [ ] Revisar que `.env` no esté versionado (`git ls-files | Select-String .env`).
- [ ] `npm audit` sin vulnerabilidades altas/críticas.

## 7. Limitaciones conocidas

- El rate limit es en memoria: con varias instancias serverless cada una tiene su propio contador. Se documenta como mitigación *best-effort*; la solución definitiva es un almacén compartido (Redis).
- No hay segundo factor de autenticación (fuera del alcance del MVP).
- No se implementó revocación individual de sesiones (sí revalidación de estado del usuario en cada request).
