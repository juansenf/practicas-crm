import {
  assertSameOrigin,
  jsonCreated,
  jsonOk,
  parseJson,
  parseQuery,
  withErrorHandling,
} from "@/lib/http";
import { clienteService } from "@/modules/clientes";
import { crearClienteSchema, filtroClientesSchema } from "@/modules/clientes/schema";
import { requerirActor } from "@/modules/auth/guards";

export const GET = withErrorHandling(async (request: Request) => {
  const actor = await requerirActor();
  const filtro = parseQuery(request, filtroClientesSchema);
  return jsonOk(await clienteService.listar(actor, filtro));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const datos = await parseJson(request, crearClienteSchema);
  return jsonCreated(await clienteService.crear(actor, datos));
});
