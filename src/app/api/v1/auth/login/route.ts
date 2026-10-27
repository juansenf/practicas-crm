import { assertSameOrigin, jsonOk, parseJson, withErrorHandling } from "@/lib/http";
import { authService } from "@/modules/auth";
import { iniciarSesionCookie } from "@/modules/auth/session";
import { loginSchema } from "@/modules/auth/schema";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);

  const datos = await parseJson(request, loginSchema);
  const actor = await authService.iniciarSesion(datos);

  await iniciarSesionCookie({
    sub: actor.id,
    nombre: actor.nombre,
    rol: actor.rol,
    clienteId: actor.clienteId,
  });

  return jsonOk({ usuario: actor });
});
