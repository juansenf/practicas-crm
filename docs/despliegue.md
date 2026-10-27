# Despliegue

Guía para publicar **Nexo** en producción con **Vercel** (aplicación) y **Neon** (PostgreSQL). Al final se incluyen alternativas y resolución de problemas.

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

- [ ] La URL pública responde por HTTPS.
- [ ] `/login` carga y permite iniciar sesión.
- [ ] La cookie `sesion` aparece con `Secure`, `HttpOnly` y `SameSite=Lax` (DevTools → Application → Cookies).
- [ ] El panel muestra métricas.
- [ ] Alta de cliente y de proyecto funcionan (los datos persisten tras recargar).
- [ ] `/docs` carga Swagger UI sin errores de CSP en la consola.
- [ ] Las cabeceras de seguridad están presentes:

  ```bash
  curl -I https://<tu-dominio>
  ```

- [ ] Un usuario `CLIENTE` no accede a `/clientes` ni a proyectos de otra empresa.
- [ ] Sexto intento fallido de login devuelve `429`.

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

- [ ] URL pública funcionando y documentada en el README.
- [ ] Repositorio público con historial de commits y PRs.
- [ ] `main` protegida y CI en verde.
- [ ] Variables de entorno cargadas en el proveedor.
- [ ] Base con migraciones aplicadas.
- [ ] Usuarios de demostración deshabilitados.
- [ ] `/docs` y `openapi.yaml` accesibles.
