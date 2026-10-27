# ADR 0002 — Arquitectura por capas con puertos y adaptadores

- **Fecha:** 2026-10-27
- **Estado:** Aceptado

## Contexto

La consigna exige una arquitectura desacoplada y por capas, con reglas de negocio testeables. Un enfoque habitual en Next.js es poner consultas Prisma dentro de los componentes o de los route handlers, lo que acopla el dominio al framework y hace que las pruebas necesiten una base de datos.

## Decisión

Separar cada módulo en:

1. **`schema.ts`** — contratos de entrada (Zod).
2. **`types.ts`** — tipos del dominio + **interfaz del repositorio** (puerto).
3. **`service.ts`** — fábrica `crear<X>Service(repo)` con las reglas de negocio y el RBAC.
4. **`repository.prisma.ts`** — adaptador que implementa el puerto.
5. **`index.ts`** — *composition root* que inyecta el adaptador.

Los servicios **no importan Prisma, Next.js ni cookies**. Reciben el `Actor` (identidad ya autenticada) y devuelven datos del dominio o lanzan errores tipados.

Para lecturas de agregados del panel se admite un *read model* de sólo lectura directo con Prisma (conteos y listados cortos), ya que no contiene reglas de negocio.

## Consecuencias

**Positivas**

- Las pruebas de negocio corren en memoria, sin base ni red (milisegundos).
- Cambiar de ORM o agregar caché no toca las reglas.
- La UI y la API comparten exactamente la misma lógica.

**Negativas**

- Más archivos por módulo y algo de *boilerplate* en `index.ts`.
- Riesgo de duplicar tipos entre Prisma y el dominio (se mitiga con mapeos explícitos en el repositorio).
