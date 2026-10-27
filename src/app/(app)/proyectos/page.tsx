import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boton, Card, EncabezadoPagina, EstadoVacio, Etiqueta, Input, Select } from "@/components/ui";
import { Paginacion } from "@/components/paginacion";
import { formatFecha, formatMoneda } from "@/lib/format";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";
import { clienteService } from "@/modules/clientes";
import { proyectoService } from "@/modules/proyectos";
import { estadoProyectoTono, ESTADOS_PROYECTO } from "@/modules/proyectos/presentacion";
import { filtroProyectosSchema } from "@/modules/proyectos/schema";
import { FormularioProyecto } from "./formulario-proyecto";

export const metadata: Metadata = { title: "Proyectos" };

export default async function PaginaProyectos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");

  const crudos = await searchParams;
  const planos = Object.fromEntries(
    Object.entries(crudos).map(([clave, valor]) => [clave, Array.isArray(valor) ? valor[0] : valor]),
  );

  const parseado = filtroProyectosSchema.safeParse(planos);
  const filtro = parseado.success ? parseado.data : { pagina: 1, porPagina: 10 };

  const interno = esRolInterno(actor);
  const [proyectos, clientes] = await Promise.all([
    proyectoService.listar(actor, filtro),
    interno ? clienteService.listar(actor, { activo: true, pagina: 1, porPagina: 100 }) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Proyectos"
        descripcion={
          interno
            ? "Cartera de proyectos del estudio, con su estado y presupuesto."
            : "Proyectos de tu empresa y su avance."
        }
      />

      {interno ? (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900 marker:hidden">
            <span className="text-marca-600 group-open:hidden">+ Nuevo proyecto</span>
            <span className="hidden text-slate-500 group-open:inline">Cerrar formulario</span>
          </summary>
          <div className="border-t border-slate-100 px-5 py-5">
            <FormularioProyecto
              clientes={(clientes?.items ?? []).map((cliente) => ({ id: cliente.id, nombre: cliente.nombre }))}
              clienteIdInicial={typeof planos.clienteId === "string" ? planos.clienteId : undefined}
            />
          </div>
        </details>
      ) : null}

      <form method="get" className="flex flex-col gap-2 sm:flex-row" role="search">
        <Input
          name="q"
          placeholder="Buscar por proyecto o cliente…"
          defaultValue={filtro.q ?? ""}
          aria-label="Buscar proyectos"
          className="sm:max-w-sm"
        />
        <Select name="estado" defaultValue={planos.estado ?? ""} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS_PROYECTO.map((estado) => (
            <option key={estado} value={estado}>
              {estado.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      <Card>
        {proyectos.items.length === 0 ? (
          <div className="p-5">
            <EstadoVacio
              titulo="No hay proyectos para mostrar"
              descripcion="Probá con otros filtros o creá un proyecto nuevo."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Proyecto</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Presupuesto</th>
                  <th className="px-5 py-3 font-semibold">Fin estimado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proyectos.items.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <Link
                        href={`/proyectos/${proyecto.id}`}
                        className="font-medium text-slate-900 hover:text-marca-700"
                      >
                        {proyecto.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{proyecto.cliente.nombre}</td>
                    <td className="px-5 py-3">
                      <Etiqueta tono={estadoProyectoTono(proyecto.estado)}>
                        {proyecto.estado.replace("_", " ")}
                      </Etiqueta>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatMoneda(proyecto.presupuesto)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatFecha(proyecto.fechaFinEstimada)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/proyectos/${proyecto.id}`}
                        className="text-sm font-medium text-marca-600 hover:text-marca-700"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {proyectos.total} proyecto{proyectos.total === 1 ? "" : "s"} encontrado
          {proyectos.total === 1 ? "" : "s"}
        </p>
        <Paginacion
          pagina={proyectos.pagina}
          totalPaginas={proyectos.totalPaginas}
          basePath="/proyectos"
          parametros={{ q: filtro.q, estado: planos.estado, clienteId: planos.clienteId }}
        />
      </div>
    </div>
  );
}
