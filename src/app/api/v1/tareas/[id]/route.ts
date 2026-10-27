import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withErrorHandling,
} from "@/lib/http";
import { tareaService } from "@/modules/tareas";
import { actualizarTareaSchema } from "@/modules/tareas/schema";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_request, ctx) => {
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await tareaService.obtener(actor, id));
});

export const PATCH = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  const datos = await parseJson(request, actualizarTareaSchema);
  return jsonOk(await tareaService.actualizar(actor, id, datos));
});

/** Baja lógica de la tarea. */
export const DELETE = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await tareaService.desactivar(actor, id));
});
