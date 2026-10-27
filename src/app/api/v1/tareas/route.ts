import {
  assertSameOrigin,
  jsonCreated,
  jsonOk,
  parseJson,
  parseQuery,
  withErrorHandling,
} from "@/lib/http";
import { tareaService } from "@/modules/tareas";
import { crearTareaSchema, filtroTareasSchema } from "@/modules/tareas/schema";
import { requerirActor } from "@/modules/auth/guards";

export const GET = withErrorHandling(async (request: Request) => {
  const actor = await requerirActor();
  const filtro = parseQuery(request, filtroTareasSchema);
  return jsonOk(await tareaService.listar(actor, filtro));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const datos = await parseJson(request, crearTareaSchema);
  return jsonCreated(await tareaService.crear(actor, datos));
});
