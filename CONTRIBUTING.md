# Guía de contribución

Este documento describe el flujo de trabajo acordado para el proyecto **Nexo**. Se aplica tanto al desarrollo individual como a una eventual incorporación de más personas al equipo.

---

## 1. Ramas

Se trabaja siempre sobre una rama, **nunca directamente sobre `main`**.

| Prefijo | Uso | Ejemplo |
| --- | --- | --- |
| `feature/` | Nueva funcionalidad o historia de usuario | `feature/clientes-baja-logica` |
| `bugfix/` | Corrección de un defecto | `bugfix/fecha-desfasada-utc` |
| `hotfix/` | Corrección urgente sobre producción | `hotfix/login-rate-limit` |
| `docs/` | Documentación | `docs/plan-de-pruebas` |
| `chore/` | Infraestructura, dependencias, configuración | `chore/ci-github-actions` |

Convención: `tipo/nro-historia-descripcion-corta` cuando exista backlog (`feature/HU-04-baja-logica-clientes`).

```bash
git switch main
git pull
git switch -c feature/HU-04-baja-logica-clientes
```

---

## 2. Commits: Conventional Commits

Formato:

```
<tipo>(<alcance>): <descripción en imperativo>

[cuerpo opcional]

[footer: Refs #12]
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Alcances sugeridos: `auth`, `clientes`, `proyectos`, `tareas`, `ui`, `db`, `api`, `docs`, `test`, `ci`, `deps`, `config`.

Ejemplos reales:

```
feat(clientes): agregar baja lógica con validación de proyectos activos
fix(tareas): impedir cambios de estado en proyectos cancelados
test(proyectos): cubrir transiciones inválidas de la máquina de estados
docs: documentar el contrato OpenAPI en /docs
```

Validación local (requiere `origin/main`):

```bash
npm run lint:commits
```

La configuración está en [`commitlint.config.mjs`](commitlint.config.mjs) y se ejecuta también en CI.

**Regla práctica:** cada commit debe compilar y dejar las pruebas en verde. Se prefiere varios commits pequeños y coherentes a uno gigante.

---

## 3. Pull Requests

1. Empujar la rama: `git push -u origin feature/HU-04-baja-logica-clientes`.
2. Abrir un PR contra `main` completando la plantilla (`.github/pull_request_template.md`).
3. Verificar que el chequeo de CI quede en verde.
4. Revisión de código (ver sección 4).
5. Merge con **squash** o **rebase**, borrando la rama.
6. La rama `main` queda protegida: sin pushes directos y con CI obligatorio.

---

## 4. Revisión de código en un equipo de una sola persona

El proyecto se desarrolla de forma **individual**, mientras que la consigna original prevé revisión por pares. La adaptación acordada con la cátedra es:

1. **Auto-revisión guiada**: antes de cada merge se completa el checklist del PR y se deja constancia en `docs/bitacora.md` de qué se revisó.
2. **Revisión diferida**: se deja pasar al menos una sesión de trabajo entre la implementación y la auto-revisión, para leer el diff con ojos frescos.
3. **Revisión externa disponible**: el repositorio queda público y los PRs documentados, de modo que el docente o un compañero pueda revisarlos *a posteriori* aunque no haya sido el autor del merge.
4. **Trazabilidad**: cada PR enlaza la historia de usuario y los commits que la implementan.

Checklist mínimo de auto-revisión:

- [ ] El código respeta la separación de capas (nada de Prisma en componentes).
- [ ] Hay validación Zod del lado del servidor y mensajes de error claros.
- [ ] Los permisos se verifican en el servicio, no sólo en la UI.
- [ ] Se agregaron o actualizaron pruebas para la regla de negocio tocada.
- [ ] `npm run lint`, `npm run typecheck` y `npm test` pasan.
- [ ] La documentación (`README`, OpenAPI, backlog) quedó actualizada.
- [ ] No se commitean secretos ni archivos `.env`.

---

## 5. Definición de terminado (Definition of Done)

Una historia se considera terminada cuando:

- Cumple todos sus criterios de aceptación.
- Tiene validación de entrada en frontend y backend.
- Muestra notificaciones de éxito, error controlado y advertencia.
- Cuenta con pruebas automatizadas de la regla de negocio involucrada.
- Está documentada (README, OpenAPI y bitácora si aplica).
- Pasa CI (`lint`, `typecheck`, `test`, `build`).
- Fue mergeada a `main` mediante PR.

---

## 6. Estilo de código

- TypeScript estricto; evitar `any` y casts innecesarios.
- Nombres de dominio en español (`Cliente`, `Proyecto`, `Tarea`), consistente con el modelo y la UI.
- Componentes de servidor por defecto; `"use client"` sólo cuando hay interactividad.
- Los errores de negocio se lanzan como `AppError` (`NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`) y los traduce `src/lib/http.ts`.
- Formateo y lint: `npm run lint`. No se aceptan *warnings* nuevos.

---

## 7. Reporte de errores

Usar la plantilla de *bug report* en `.github/ISSUE_TEMPLATE/`. Incluir:

- Pasos para reproducir.
- Comportamiento esperado vs. obtenido.
- Rol con el que se reprodujo y datos relevantes (sin credenciales reales).
- Capturas o mensajes de la consola/red si aplica.
