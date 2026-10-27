import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { obtenerActor } from "@/modules/auth/session";
import { FormularioRegistro } from "./formulario-registro";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function PaginaRegistro() {
  if (await obtenerActor()) redirect("/dashboard");

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Crear cuenta de cliente</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Registrá tu empresa para hacer seguimiento de tus proyectos.
      </p>

      <FormularioRegistro />

      <p className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-marca-600 hover:text-marca-700">
          Iniciá sesión
        </Link>
      </p>
    </Card>
  );
}
