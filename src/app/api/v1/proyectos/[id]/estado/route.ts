import { assertSameOrigin, jsonOk, parseJson, withErrorHandling } from "@/lib/http";
import { proyectoService } from "@/modules/proyectos";
import { cambiarEstadoProyectoSchema } from "@/modules/proyectos/schema";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

/** Cambio de estado validado contra las transiciones permitidas. */
export const PATCH = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  const { estado } = await parseJson(request, cambiarEstadoProyectoSchema);
  return jsonOk(await proyectoService.cambiarEstado(actor, id, estado));
});
