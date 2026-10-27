import { assertSameOrigin, jsonOk, parseJson, withErrorHandling } from "@/lib/http";
import { tareaService } from "@/modules/tareas";
import { cambiarEstadoTareaSchema } from "@/modules/tareas/schema";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

/** Cambio de estado validado contra las transiciones permitidas. */
export const PATCH = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  const { estado } = await parseJson(request, cambiarEstadoTareaSchema);
  return jsonOk(await tareaService.cambiarEstado(actor, id, estado));
});
