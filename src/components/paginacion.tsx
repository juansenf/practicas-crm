import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Paginación server-side: los enlaces preservan los filtros activos y son
 * navegables sin JavaScript.
 */
export function Paginacion({
  pagina,
  totalPaginas,
  basePath,
  parametros,
}: {
  pagina: number;
  totalPaginas: number;
  basePath: string;
  parametros: Record<string, string | undefined>;
}) {
  if (totalPaginas <= 1) return null;

  function urlPara(destino: number) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor) params.set(clave, valor);
    }
    params.set("pagina", String(destino));
    return `${basePath}?${params.toString()}`;
  }

  const claseBase = "rounded-md border px-3 py-1.5 text-sm font-medium";

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
      <p className="text-sm text-slate-600">
        Página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        {pagina > 1 ? (
          <Link href={urlPara(pagina - 1)} className={cn(claseBase, "border-slate-300 bg-white hover:bg-slate-50")}>
            Anterior
          </Link>
        ) : (
          <span className={cn(claseBase, "border-slate-200 bg-slate-50 text-slate-400")}>Anterior</span>
        )}
        {pagina < totalPaginas ? (
          <Link href={urlPara(pagina + 1)} className={cn(claseBase, "border-slate-300 bg-white hover:bg-slate-50")}>
            Siguiente
          </Link>
        ) : (
          <span className={cn(claseBase, "border-slate-200 bg-slate-50 text-slate-400")}>Siguiente</span>
        )}
      </div>
    </nav>
  );
}
