# ADR 0003 — Sesión con JWT en cookie HttpOnly

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

La consigna pide sesiones seguras (JWT o sesiones autenticadas) y mitigaciones de OWASP. Las alternativas eran:

- **A.** Sesión en base de datos con `sessionId` en cookie.
- **B.** JWT en `localStorage` enviado por `Authorization`.
- **C.** JWT en cookie `HttpOnly`.

## Decisión

**C.** El login emite un JWT HS256 (`jose`) con claims mínimos (`sub`, `nombre`, `rol`, `clienteId`, `iss`, `aud`, `iat`, `exp`) y lo guarda en la cookie `sesion` con `HttpOnly`, `SameSite=Lax`, `Secure` en producción y `maxAge` = `SESSION_TTL_SECONDS` (8 h por defecto).

`obtenerActor()` **revalida contra la base** en cada request (memoizado con `cache()`), de modo que una baja o un cambio de rol tienen efecto inmediato aunque el token siga vigente.

## Consecuencias

**Positivas**

- Sin tabla de sesiones ni limpieza periódica; escala horizontalmente sin estado.
- `HttpOnly` elimina el robo de token por XSS; `SameSite=Lax` + verificación de `Origin` mitigan CSRF.
- La revalidación en base corrige el principal defecto de los JWT (no revocables).

**Negativas**

- Cada request autenticado hace una consulta a la base (aceptable para este volumen).
- El proxy no puede revalidar (sin acceso a base en el edge): sólo verifica la firma. Se documenta explícitamente para no confundir *optimización de navegación* con *autorización*.
- Al no poder revocar tokens, un cambio de `AUTH_SECRET` invalida todas las sesiones (comportamiento deseado ante incidentes).
