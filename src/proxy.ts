import { NextResponse, type NextRequest } from "next/server";
import { verificarSesion } from "@/modules/auth/jwt";
import { COOKIE_SESION } from "@/lib/constants";

const RUTAS_PUBLICAS = ["/login", "/registro", "/docs"];

/**
 * Proxy (ex middleware en Next.js 16).
 *
 * Hace una verificación *optimista* del JWT para redirigir temprano:
 *  - sin sesión → /login (y borra la cookie si el token ya no es válido)
 *
 * No redirige las rutas públicas aunque haya cookie: si el token es válido
 * pero el usuario fue dado de baja, el proxy no puede saberlo (no consulta la
 * base) y un redirect a /dashboard desde /login produciría un bucle. Ese
 * "ya estás logueado" se resuelve en las páginas de login y registro, que sí
 * validan contra la base.
 *
 * La autorización real (rol, estado del usuario, propiedad del recurso) se
 * valida siempre en el servidor, en los servicios y route handlers.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESION)?.value;
  const sesion = token ? await verificarSesion(token) : null;

  const esPublica = RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));

  if (!sesion && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("redirect", pathname);
    const respuesta = NextResponse.redirect(url);
    if (token) respuesta.cookies.delete(COOKIE_SESION);
    return respuesta;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Se excluyen assets, API (protegida por guards propios) y archivos estáticos.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|openapi\\.yaml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|yaml|css|js)$).*)",
  ],
};
