import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonSalir } from "@/components/boton-salir";
import { NavPrincipal } from "@/components/nav-principal";
import { Etiqueta } from "@/components/ui";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  CLIENTE: "Cliente",
};

export default async function LayoutApp({ children }: { children: ReactNode }) {
  const actor = await obtenerActor();
  if (!actor) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:flex lg:flex-col lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-marca-600 text-sm font-bold text-white">
              N
            </span>
            Nexo
          </Link>
          <div className="lg:hidden">
            <Etiqueta tono="info">{ETIQUETA_ROL[actor.rol]}</Etiqueta>
          </div>
        </div>

        <div className="mt-4 lg:mt-8 lg:flex-1">
          <NavPrincipal esInterno={esRolInterno(actor)} />
        </div>

        <div className="mt-4 hidden border-t border-slate-200 pt-4 lg:block">
          <p className="truncate text-sm font-medium text-slate-900">{actor.nombre}</p>
          <div className="mt-1 mb-3">
            <Etiqueta tono="info">{ETIQUETA_ROL[actor.rol]}</Etiqueta>
          </div>
          <BotonSalir />
        </div>

        <div className="mt-3 lg:hidden">
          <BotonSalir />
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
