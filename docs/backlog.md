# Backlog e historias de usuario

Tablero Kanban con cinco columnas: **Backlog → Por hacer → En curso → En revisión → Hecho**. El estado consolidado y la trazabilidad historia → rama → commits están en [`kanban.md`](kanban.md).

Convenciones:

- **Prioridad**: `Alta` (MVP), `Media` (mejora del MVP), `Baja` (deseable).
- **Estimación** en puntos de historia (1 = muy simple, 5 = compleja).
- Cada historia incluye criterios de aceptación verificables.
- El estado refleja el avance real del repositorio.

## Resumen del tablero

| ID | Historia | Épica | Prioridad | Puntos | Estado |
| --- | --- | --- | --- | :---: | --- |
| HU-01 | Registro público de clientes | Autenticación | Alta | 3 | Hecho |
| HU-02 | Inicio de sesión con credenciales | Autenticación | Alta | 3 | Hecho |
| HU-03 | Cierre de sesión | Autenticación | Alta | 1 | Hecho |
| HU-04 | Control de acceso por roles | Autenticación | Alta | 3 | Hecho |
| HU-05 | Alta y listado de clientes | Clientes | Alta | 3 | Hecho |
| HU-06 | Edición de clientes | Clientes | Alta | 2 | Hecho |
| HU-07 | Baja lógica y reactivación de clientes | Clientes | Alta | 3 | Hecho |
| HU-08 | Alta y listado de proyectos | Proyectos | Alta | 3 | Hecho |
| HU-09 | Ciclo de vida del proyecto | Proyectos | Alta | 3 | Hecho |
| HU-10 | Edición y baja lógica de proyectos | Proyectos | Media | 3 | Hecho |
| HU-11 | Gestión de tareas por proyecto | Tareas | Alta | 3 | Hecho |
| HU-12 | Cambio de estado de tareas | Tareas | Alta | 2 | Hecho |
| HU-13 | Portal del cliente (sólo su empresa) | Portal | Alta | 3 | Hecho |
| HU-14 | Panel con métricas | Portal | Media | 2 | Hecho |
| HU-15 | Documentación de la API | Calidad | Alta | 3 | Hecho |
| HU-16 | Pruebas automatizadas | Calidad | Alta | 5 | Hecho |
| HU-17 | Pipeline de integración continua | Calidad | Media | 3 | Hecho |
| HU-18 | Despliegue en la nube | Calidad | Alta | 3 | Hecho |

---

## Épica: Autenticación

### HU-01 — Registro público de clientes

**Como** visitante que representa a una empresa, **quiero** crear una cuenta desde el sitio público, **para** acceder al seguimiento de mis proyectos.

**Criterios de aceptación**

- [ ] El formulario pide nombre, empresa, email y contraseña.
- [ ] La contraseña exige mínimo 10 caracteres, al menos una letra y un número (máximo 72 por bcrypt).
- [ ] El email se normaliza (trim + minúsculas) y se valida el formato.
- [ ] Se crea la empresa (`Cliente`) y el usuario con rol `CLIENTE` en una transacción; si falla cualquiera, no queda ninguno de los dos.
- [ ] Un email ya registrado devuelve `409` con el detalle en el campo `email` (sin revelar datos extra).
- [ ] Al registrarse, la sesión queda iniciada y se redirige al panel.
- [ ] Los errores se muestran junto al campo y con un toast.

**Reglas de negocio**: email único en `Cliente` y en `Usuario`; el usuario creado queda activo.

---

### HU-02 — Inicio de sesión con credenciales

**Como** usuario registrado, **quiero** iniciar sesión con email y contraseña, **para** acceder a mi panel.

**Criterios de aceptación**

- [ ] Credenciales válidas → `200`, cookie `sesion` (`HttpOnly`, `SameSite=Lax`, 8 h) y redirección al destino solicitado o al panel.
- [ ] Credenciales inválidas → `401` con mensaje genérico «Email o contraseña incorrectos.».
- [ ] Un email inexistente tarda un tiempo comparable a una contraseña incorrecta (hash de relleno).
- [ ] Una cuenta dada de baja → `403`.
- [ ] Tras 5 intentos fallidos en 15 minutos para el mismo email → `429` con indicación de espera.
- [ ] El parámetro `?redirect=` acepta sólo rutas internas (sin `//` ni dominios externos).
- [ ] Un usuario ya autenticado que entra a `/login` es redirigido al panel (validado contra la base).

---

### HU-03 — Cierre de sesión

**Como** usuario autenticado, **quiero** cerrar sesión, **para** dejar de tener acceso desde ese dispositivo.

**Criterios de aceptación**

- [ ] El botón «Cerrar sesión» del panel invoca `POST /api/v1/auth/logout`.
- [ ] La cookie se elimina y el usuario es redirigido a `/login`.
- [ ] Un intento de acceder a una ruta privada después del logout redirige a `/login`.

---

### HU-04 — Control de acceso por roles

**Como** responsable del sistema, **quiero** que cada rol acceda sólo a lo que le corresponde, **para** proteger la información de cada empresa.

**Criterios de aceptación**

- [ ] `ADMIN` y `OPERADOR` gestionan clientes, proyectos y tareas.
- [ ] `CLIENTE` no ve el módulo de clientes en la navegación ni puede acceder por URL (`/clientes` → panel).
- [ ] `GET /api/v1/clientes` con rol `CLIENTE` devuelve `403`.
- [ ] Un `CLIENTE` que solicita un proyecto de otra empresa recibe `403` en la API y es redirigido en la UI.
- [ ] El filtrado por empresa ocurre en el servidor, ignorando cualquier `clienteId` enviado por el cliente.
- [ ] Las reglas viven en el servicio (`policy.ts`), no en la interfaz.

---

## Épica: Clientes

### HU-05 — Alta y listado de clientes

**Como** integrante del estudio, **quiero** registrar clientes y consultarlos, **para** tener un padrón actualizado.

**Criterios de aceptación**

- [ ] Nombre (2–100) y email válidos son obligatorios; CUIT opcional de 11 dígitos (acepta guiones) y único.
- [ ] Teléfono admite sólo números, espacios y `+ ( ) -` (6–30 caracteres).
- [ ] Email y CUIT duplicados devuelven `409` con el error en el campo correspondiente.
- [ ] El listado muestra nombre, email, CUIT, teléfono y estado; permite buscar por nombre/email/CUIT y filtrar por activos/dados de baja.
- [ ] La lista está paginada (10 por página por defecto, máximo 100) y muestra el total.
- [ ] El alta exitosa muestra un toast de confirmación y refresca el listado.

---

### HU-06 — Edición de clientes

**Como** integrante del estudio, **quiero** editar la ficha de un cliente, **para** mantener sus datos al día.

**Criterios de aceptación**

- [ ] Se pueden modificar todos los campos; se exige al menos uno.
- [ ] Las validaciones son las mismas que en el alta.
- [ ] Email o CUIT que pertenezcan a otro cliente devuelven `409`.
- [ ] La ficha muestra datos de contacto, notas y proyectos asociados.
- [ ] La edición exitosa muestra un toast y refleja los cambios sin recargar manualmente.

---

### HU-07 — Baja lógica y reactivación de clientes

**Como** integrante del estudio, **quiero** dar de baja y reactivar clientes, **para** conservar el historial sin perder información.

**Criterios de aceptación**

- [ ] `DELETE /api/v1/clientes/{id}` marca `activo=false` y `eliminadoEn`; no borra registros.
- [ ] Si el cliente tiene proyectos activos, la operación devuelve `409` con un mensaje claro.
- [ ] El cliente dado de baja desaparece de los listados por defecto y puede verse con el filtro «Dados de baja».
- [ ] `POST /api/v1/clientes/{id}/reactivar` lo vuelve a habilitar.
- [ ] Un cliente dado de baja no puede recibir proyectos nuevos (`409`).

---

## Épica: Proyectos

### HU-08 — Alta y listado de proyectos

**Como** integrante del estudio, **quiero** crear proyectos asociados a un cliente, **para** organizar el trabajo contratado.

**Criterios de aceptación**

- [ ] Nombre (2–100), cliente y fecha de inicio son obligatorios; presupuesto ≥ 0 y fecha de fin estimada opcionales.
- [ ] Sólo se puede asociar un cliente existente y activo (`409` en caso contrario).
- [ ] El proyecto nace en estado `PLANIFICADO`.
- [ ] El listado muestra proyecto, cliente, estado, presupuesto y fin estimado; filtra por estado y búsqueda.
- [ ] La fecha se muestra en formato `dd/mm/aaaa` sin desplazamiento por zona horaria.
- [ ] El alta exitosa muestra un toast y el proyecto aparece en el listado.

---

### HU-09 — Ciclo de vida del proyecto

**Como** integrante del estudio, **quiero** cambiar el estado de un proyecto respetando su ciclo de vida, **para** reflejar la realidad del trabajo.

**Criterios de aceptación**

- [ ] Transiciones válidas: `PLANIFICADO → EN_CURSO | CANCELADO`; `EN_CURSO → PAUSADO | FINALIZADO | CANCELADO`; `PAUSADO → EN_CURSO | CANCELADO`.
- [ ] `FINALIZADO` y `CANCELADO` son terminales.
- [ ] Una transición inválida devuelve `409` con un mensaje que indica el estado actual.
- [ ] Sólo `ADMIN` y `OPERADOR` cambian el estado (`403` para `CLIENTE`).
- [ ] La UI ofrece únicamente las transiciones posibles desde el estado actual.
- [ ] El cambio exitoso muestra un toast con el nuevo estado.

---

### HU-10 — Edición y baja lógica de proyectos

**Como** integrante del estudio, **quiero** editar o dar de baja un proyecto, **para** corregir datos o cerrar la relación.

**Criterios de aceptación**

- [ ] No se puede editar un proyecto `FINALIZADO` o `CANCELADO` (`409`).
- [ ] La baja lógica desactiva el proyecto y sus tareas en una transacción.
- [ ] Si hay tareas `EN_PROGRESO`, la baja devuelve `409` indicando cuántas.
- [ ] Un proyecto dado de baja no aparece en los listados por defecto.

---

## Épica: Tareas

### HU-11 — Gestión de tareas por proyecto

**Como** integrante del estudio, **quiero** crear y asignar tareas a un proyecto, **para** desglosar el trabajo.

**Criterios de aceptación**

- [ ] Título (3–150) y proyecto son obligatorios; descripción, prioridad (`BAJA|MEDIA|ALTA`), fecha límite, horas estimadas (0–999) y responsable son opcionales.
- [ ] Sólo se permiten tareas en proyectos activos y no finalizados/cancelados (`409`).
- [ ] El responsable debe ser un usuario interno activo (`ADMIN` u `OPERADOR`).
- [ ] La tarea nace `PENDIENTE` con prioridad `MEDIA` por defecto.
- [ ] La tabla de tareas muestra estado, prioridad, responsable y fecha límite, con acciones por fila.

---

### HU-12 — Cambio de estado de tareas

**Como** integrante del estudio, **quiero** actualizar el estado de una tarea, **para** reflejar su avance.

**Criterios de aceptación**

- [ ] Transiciones: `PENDIENTE → EN_PROGRESO | BLOQUEADA | COMPLETADA`; `EN_PROGRESO → PENDIENTE | BLOQUEADA | COMPLETADA`; `BLOQUEADA → PENDIENTE | EN_PROGRESO`; `COMPLETADA → EN_PROGRESO`.
- [ ] Una transición inválida devuelve `409`.
- [ ] No se puede modificar una tarea de un proyecto cancelado.
- [ ] Sólo el personal interno cambia estados (`403` para `CLIENTE`).
- [ ] El cambio exitoso muestra un toast y actualiza la fila.

---

## Épica: Portal del cliente

### HU-13 — Portal del cliente

**Como** usuario con rol `CLIENTE`, **quiero** ver sólo la información de mi empresa, **para** hacer seguimiento sin acceder a datos de terceros.

**Criterios de aceptación**

- [ ] La navegación no muestra «Clientes».
- [ ] El listado de proyectos muestra únicamente los de su `clienteId`, incluso si intenta forzar el filtro por URL.
- [ ] `/api/v1/clientes` devuelve `403`; `/api/v1/proyectos/{id}` de otra empresa también.
- [ ] Acceder por URL a un proyecto ajeno redirige al panel.
- [ ] El panel muestra métricas y listados acotados a su empresa.

---

### HU-14 — Panel con métricas

**Como** usuario autenticado, **quiero** un panel de inicio con el estado general, **para** tener contexto al entrar.

**Criterios de aceptación**

- [ ] Para roles internos: clientes activos, proyectos en curso y tareas abiertas de toda la cartera.
- [ ] Para `CLIENTE`: proyectos en curso y tareas abiertas de su empresa (sin métrica de clientes).
- [ ] Muestra los últimos 5 proyectos y las próximas 6 tareas con vencimiento.
- [ ] Cada bloque enlaza al listado correspondiente.
- [ ] El layout es responsive (sidebar en escritorio, encabezado compacto en móvil).

---

## Épica: Calidad

### HU-15 — Documentación de la API

**Como** desarrollador o evaluador, **quiero** una documentación navegable de la API, **para** entender y probar los endpoints.

**Criterios de aceptación**

- [ ] `public/openapi.yaml` describe todos los endpoints, esquemas, roles y códigos de error (OpenAPI 3.1).
- [ ] `/docs` monta Swagger UI servido localmente, compatible con la CSP.
- [ ] Se puede probar el flujo completo desde la consola (login → operaciones) en entorno local.
- [ ] El README enlaza el contrato y la consola.

---

### HU-16 — Pruebas automatizadas

**Como** responsable de calidad, **quiero** pruebas automáticas de las reglas críticas, **para** evitar regresiones.

**Criterios de aceptación**

- [ ] Pruebas unitarias de las reglas de clientes, proyectos, tareas y autenticación.
- [ ] Pruebas de máquinas de estado (transiciones válidas e inválidas).
- [ ] Pruebas de RBAC e IDOR (un `CLIENTE` no accede a otra empresa).
- [ ] Pruebas de hash de contraseñas, JWT y rate limiter.
- [ ] Pruebas de integración contra PostgreSQL real (constraints, FK, transacciones).
- [ ] `npm test` corre todo y falla si algo se rompe.

---

### HU-17 — Pipeline de integración continua

**Como** responsable del repositorio, **quiero** un pipeline que valide cada PR, **para** no mergear código roto.

**Criterios de aceptación**

- [ ] GitHub Actions ejecuta lint, typecheck, tests y build en cada PR y push a `main`.
- [ ] El job de tests levanta un PostgreSQL de servicio y aplica migraciones.
- [ ] Se valida el formato de los mensajes de commit (Commitlint).
- [ ] El pipeline debe estar en verde para mergear.

---

### HU-18 — Despliegue en la nube

**Como** usuario final, **quiero** acceder al sistema desde una URL pública, **para** usarlo sin instalar nada.

**Criterios de aceptación**

- [x] Aplicación desplegada y accesible por HTTPS.
- [x] Base PostgreSQL gestionada, con migraciones aplicadas.
- [x] Variables de entorno configuradas en el proveedor (sin secretos en el repositorio).
- [x] Login, CRUD y `/docs` funcionan en producción.
- [x] Cookie con flag `Secure` en producción.

**Evidencia:** <https://practicas-crm.vercel.app> · Vercel + Neon (PostgreSQL 18, `aws-sa-east-1`) · verificación del 2026-10-27 en [`despliegue.md`](despliegue.md#0-estado-actual-del-despliegue).
