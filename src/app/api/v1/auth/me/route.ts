import { jsonOk, withErrorHandling } from "@/lib/http";
import { requerirActor } from "@/modules/auth/guards";

export const GET = withErrorHandling(async () => {
  const actor = await requerirActor();
  return jsonOk({ usuario: actor });
});
