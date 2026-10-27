# Despliegue

Guía para publicar **Nexo** en producción con **Vercel** (aplicación) y **Neon** (PostgreSQL). Al final se incluyen alternativas y resolución de problemas.

## 0. Estado actual del despliegue

| Dato | Valor |
| --- | --- |
| URL pública | <https://practicas-crm.vercel.app> |
| Proyecto Vercel | `practicas-crm` (equipo `plan-agency`) |
| Base de datos | Neon `practicas-crm`, PostgreSQL 18, región `aws-sa-east-1` |
| Migraciones | `20261027034445_init` aplicada con `prisma migrate deploy` |
| Datos | Seed de demostración cargado (3 usuarios, 2 clientes, 3 proyectos) |
| Repositorio vinculado | `juansenf/practicas-crm`, *Production Branch* `main` (deploy automático en cada merge) |
| Verificado | 2026-10-27: login, `/docs`, `openapi.yaml`, cookie `Secure`, RBAC y `429` |

Los usuarios de demostración se mantienen activos **a propósito** para que la cátedra pueda evaluar la aplicación. En un entorno real se eliminan antes de publicar (ver sección 4).

## 1. Arquitectura del despliegue

```
Navegador ──HTTPS──► Vercel (Next.js) ──TLS──► Neon (PostgreSQL)
                        │
                        └── variables de entorno: DATABASE_URL, AUTH_SECRET
```

## 2. Preparar la base de datos (Neon)

1. Crear una cuenta en <https://neon.tech> y un proyecto.
2. Crear una base `practicas_crm` (o usar la que provee el proyecto).
3. Copiar la **connection string** con SSL, por ejemplo:

   ```
   postgresql://usuario:password@ep-xxx-xxx.us-east-2.aws.neon.tech/practicas_crm?sslmode=require
   ```

4. (Recomendado) Usar el endpoint *pooled* para la aplicación y el directo para migraciones.

> Neon suspende la instancia por inactividad; la primera petición puede tardar unos segundos. Es normal en el plan gratuito.

## 3. Desplegar en Vercel

1. Subir el repositorio a GitHub.
2. En Vercel: **Add New → Project → Import Git Repository**.
3. Configuración del proyecto:
   - **Framework preset**: Next.js (detectado automáticamente).
   - **Build command**: Vercel usa el script `vercel-build` del repositorio (`prisma migrate deploy && next build`), que aplica las migraciones antes de compilar. No hace falta configurarlo a mano.
   - **Install command**: `npm install` (ejecuta `postinstall` → `prisma generate`).
4. Variables de entorno (Production y Preview):

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | Connection string de Neon. |
   | `AUTH_SECRET` | Secreto de 32+ bytes generado con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. |
   | `SESSION_TTL_SECONDS` | `28800` (opcional). |

5. **Deploy**.

### 3.1 Despliegue automático

El proyecto quedó vinculado al repositorio (`Production Branch`: `main`). A partir de eso:

- Cada **push a `main`** (o sea, cada PR mergeado) dispara un deployment de producción.
- Cada **push a una rama con PR abierto** genera un *Preview Deployment* con su propia URL.
- El build corre `vercel-build` → `prisma migrate deploy && next build`, así que las migraciones versionadas se aplican antes de publicar.

Para conectar el repositorio hace falta que la GitHub App de Vercel esté instalada sobre la cuenta dueña del repo y que la cuenta de Vercel tenga esa identidad de GitHub conectada (*Account Settings → Authentication → Login Connections*). Si Vercel muestra otra identidad, la vinculación falla con `You need admin or write access to the repository` o `you need to install the GitHub integration first`.

Verificación del vínculo:

```bash
vercel git connect     # debe responder "Connected"
vercel inspect https://practicas-crm.vercel.app
```

Deploy manual de emergencia (si el pipeline no está disponible):

```bash
vercel --prod --yes
```

### Generación del cliente Prisma

`package.json` incluye:

```json
"postinstall": "prisma generate"
```

Si se despliega en otra plataforma que no ejecuta `postinstall`, ejecutar `npm run db:generate` antes del build.

## 4. Cargar datos iniciales

Opcional, para una demo:

```bash
DATABASE_URL="postgresql://...neon.tech/practicas_crm?sslmode=require" npm run db:seed
```

> En producción real: **no** ejecutar el seed con los usuarios de demostración. Crear el primer administrador con un script propio y contraseñas fuertes.

## 5. Verificación posterior al despliegue

- [x] La URL pública responde por HTTPS.
- [x] `/login` carga y permite iniciar sesión.
- [x] La cookie `sesion` aparece con `Secure`, `HttpOnly` y `SameSite=Lax` (DevTools → Application → Cookies).
- [x] El panel muestra métricas.
- [x] Alta de cliente y de proyecto funcionan (los datos persisten tras recargar).
- [x] `/docs` carga Swagger UI sin errores de CSP en la consola.
- [x] Las cabeceras de seguridad están presentes:

  ```bash
  curl -I https://<tu-dominio>
  ```

- [x] Un usuario `CLIENTE` no accede a `/clientes` ni a proyectos de otra empresa.
- [x] Sexto intento fallido de login devuelve `429`.

## 6. Migraciones en el futuro

```bash
# en local: crear la migración
npm run db:migrate

# commitear prisma/migrations/** y desplegar:
# el build de Vercel ejecuta `prisma migrate deploy`
```

Nunca editar una migración ya aplicada; crear una nueva.

## 7. Rollback

| Escenario | Acción |
| --- | --- |
| Error en la aplicación | Vercel → Deployments → *Promote* del despliegue anterior. |
| Migración destructiva | Restaurar el backup/snapshot de Neon y desplegar la versión anterior del código. |
| Secreto comprometido | Rotar `AUTH_SECRET` (invalida todas las sesiones) y redesplegar. |

## 8. Alternativas

- **Base de datos**: Railway, Supabase, Render PostgreSQL, Vercel Postgres. Cualquier PostgreSQL 16+ compatible sirve; sólo cambia `DATABASE_URL`.
- **Hosting**: Railway o Render (build `npm run build`, start `npm start`). En ese caso, ejecutar `npm run db:deploy` como paso de *release* manual o en el pipeline.

## 9. Resolución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `Can't reach database server` | URL incorrecta, SSL o base suspendida | Verificar `DATABASE_URL` con `?sslmode=require`; despertar la base. |
| `The table does not exist` | Migraciones no aplicadas | Ejecutar `npm run db:deploy` con la URL de producción. |
| `AUTH_SECRET debe tener al menos 32 caracteres` | Secreto corto o ausente | Generar uno nuevo y redesplegar. |
| Redirección infinita al login | Cookie vieja de otro entorno | Borrar cookies del dominio; el proxy elimina tokens inválidos. |
| `PrismaClientInitializationError` en build | Cliente no generado | Verificar `postinstall`/`npm run db:generate`. |
| Swagger UI no carga | CSP o assets faltantes | Confirmar `public/docs/swagger-ui/*` y que `/docs` esté en rutas públicas. |

## 10. Checklist de entrega

- [x] URL pública funcionando y documentada en el README.
- [x] Repositorio público con historial de commits y PRs.
- [x] `main` protegida y CI en verde.
- [x] Variables de entorno cargadas en el proveedor.
- [x] Base con migraciones aplicadas.
- [ ] Usuarios de demostración deshabilitados (se conservan para la evaluación).
- [x] `/docs` y `openapi.yaml` accesibles.
