import { assertSameOrigin, jsonCreated, parseJson, withErrorHandling } from "@/lib/http";
import { authService } from "@/modules/auth";
import { iniciarSesionCookie } from "@/modules/auth/session";
import { registroSchema } from "@/modules/auth/schema";

/**
 * Auto-registro público del portal de clientes.
 * Crea la empresa (Cliente) y su usuario con rol CLIENTE.
 */
export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);

  const datos = await parseJson(request, registroSchema);
  const actor = await authService.registrar(datos);

  await iniciarSesionCookie({
    sub: actor.id,
    nombre: actor.nombre,
    rol: actor.rol,
    clienteId: actor.clienteId,
  });

  return jsonCreated({ usuario: actor });
});
