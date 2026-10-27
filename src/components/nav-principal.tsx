"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ENLACES = [
  { href: "/dashboard", etiqueta: "Panel" },
  { href: "/clientes", etiqueta: "Clientes", soloInterno: true },
  { href: "/proyectos", etiqueta: "Proyectos" },
  { href: "/tareas", etiqueta: "Tareas" },
];

export function NavPrincipal({ esInterno }: { esInterno: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-wrap gap-1 lg:flex-col">
      {ENLACES.filter((enlace) => !enlace.soloInterno || esInterno).map((enlace) => {
        const activo = pathname === enlace.href || pathname.startsWith(`${enlace.href}/`);
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "bg-marca-50 text-marca-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {enlace.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
