import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withErrorHandling,
} from "@/lib/http";
import { clienteService } from "@/modules/clientes";
import { actualizarClienteSchema } from "@/modules/clientes/schema";
import { requerirActor } from "@/modules/auth/guards";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_request, ctx) => {
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await clienteService.obtener(actor, id));
});

export const PATCH = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  const datos = await parseJson(request, actualizarClienteSchema);
  return jsonOk(await clienteService.actualizar(actor, id, datos));
});

/** Baja lógica del cliente. */
export const DELETE = withErrorHandling<Ctx>(async (request, ctx) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const { id } = await ctx.params;
  return jsonOk(await clienteService.desactivar(actor, id));
});
