import { assertSameOrigin, jsonOk, withErrorHandling } from "@/lib/http";
import { clienteService } from "@/modules/clientes";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

/** Reactivación de un cliente dado de baja lógicamente. */
export const POST = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await clienteService.reactivar(actor, id));
});
