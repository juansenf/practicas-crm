import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { obtenerActor } from "@/modules/auth/session";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Se valida contra la base, no solo contra la cookie: un token de un usuario
  // dado de baja no debe dejar la pantalla de login inaccesible.
  if (await obtenerActor()) redirect("/dashboard");

  const { redirect: destinoSolicitado } = await searchParams;
  // Solo rutas internas: evita redirecciones abiertas hacia otros dominios.
  const destino =
    destinoSolicitado?.startsWith("/") && !destinoSolicitado.startsWith("//")
      ? destinoSolicitado
      : "/dashboard";

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Accedé con las credenciales que te asignó el administrador.
      </p>

      <FormularioLogin redirectA={destino} />

      <p className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
        ¿Sos cliente y todavía no tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca-600 hover:text-marca-700">
          Registrate
        </Link>
      </p>
    </Card>
  );
}
