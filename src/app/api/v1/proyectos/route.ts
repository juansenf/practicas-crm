import {
  assertSameOrigin,
  jsonCreated,
  jsonOk,
  parseJson,
  parseQuery,
  withErrorHandling,
} from "@/lib/http";
import { proyectoService } from "@/modules/proyectos";
import { crearProyectoSchema, filtroProyectosSchema } from "@/modules/proyectos/schema";
import { requerirActor } from "@/modules/auth/guards";

export const GET = withErrorHandling(async (request: Request) => {
  const actor = await requerirActor();
  const filtro = parseQuery(request, filtroProyectosSchema);
  return jsonOk(await proyectoService.listar(actor, filtro));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const actor = await requerirActor();
  const datos = await parseJson(request, crearProyectoSchema);
  return jsonCreated(await proyectoService.crear(actor, datos));
});
