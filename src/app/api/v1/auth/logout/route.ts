import { assertSameOrigin, jsonNoContent, withErrorHandling } from "@/lib/http";
import { cerrarSesionCookie } from "@/modules/auth/session";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await cerrarSesionCookie();
  return jsonNoContent();
});
