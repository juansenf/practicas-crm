import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withErrorHandling,
} from "@/lib/http";
import { proyectoService } from "@/modules/proyectos";
import { actualizarProyectoSchema } from "@/modules/proyectos/schema";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_request, ctx) => {
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await proyectoService.obtener(actor, id));
});

export const PATCH = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  const datos = await parseJson(request, actualizarProyectoSchema);
  return jsonOk(await proyectoService.actualizar(actor, id, datos));
});

/** Baja lógica del proyecto y sus tareas. */
export const DELETE = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await proyectoService.desactivar(actor, id));
});
