import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boton, Card, EncabezadoPagina, EstadoVacio, Etiqueta, Input, Select } from "@/components/ui";
import { Paginacion } from "@/components/paginacion";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";
import { clienteService } from "@/modules/clientes";
import { filtroClientesSchema } from "@/modules/clientes/schema";
import { FormularioCliente } from "./formulario-cliente";

export const metadata: Metadata = { title: "Clientes" };

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");
  if (!esRolInterno(actor)) redirect("/dashboard");

  const crudos = await searchParams;
  const planos = Object.fromEntries(
    Object.entries(crudos).map(([clave, valor]) => [clave, Array.isArray(valor) ? valor[0] : valor]),
  );

  const parseado = filtroClientesSchema.safeParse(planos);
  const filtro = parseado.success
    ? parseado.data
    : { pagina: 1, porPagina: 10, q: undefined, activo: undefined };

  const { items, total, paginas, pagina } = await clienteService
    .listar(actor, filtro)
    .then((resultado) => ({
      items: resultado.items,
      total: resultado.total,
      paginas: resultado.totalPaginas,
      pagina: resultado.pagina,
    }));

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Padrón de clientes del estudio. Las bajas son lógicas: el historial se conserva."
      />

      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900 marker:hidden">
          <span className="text-marca-600 group-open:hidden">+ Nuevo cliente</span>
          <span className="hidden text-slate-500 group-open:inline">Cerrar formulario</span>
        </summary>
        <div className="border-t border-slate-100 px-5 py-5">
          <FormularioCliente />
        </div>
      </details>

      <form method="get" className="flex flex-col gap-2 sm:flex-row" role="search">
        <Input
          name="q"
          placeholder="Buscar por nombre, email o CUIT…"
          defaultValue={filtro.q ?? ""}
          aria-label="Buscar clientes"
          className="sm:max-w-sm"
        />
        <Select name="activo" defaultValue={planos.activo ?? ""} aria-label="Filtrar por estado">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Dados de baja</option>
        </Select>
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      <Card>
        {items.length === 0 ? (
          <div className="p-5">
            <EstadoVacio
              titulo="No se encontraron clientes"
              descripcion="Ajustá los filtros o creá el primer cliente del estudio."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">CUIT</th>
                  <th className="px-5 py-3 font-semibold">Teléfono</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="font-medium text-slate-900 hover:text-marca-700"
                      >
                        {cliente.nombre}
                      </Link>
                      <p className="text-xs text-slate-500">{cliente.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{cliente.cuit ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{cliente.telefono ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Etiqueta tono={cliente.activo ? "exito" : "neutral"}>
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </Etiqueta>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="text-sm font-medium text-marca-600 hover:text-marca-700"
                      >
                        Ver ficha
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
          {total} cliente{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}
        </p>
        <Paginacion
          pagina={pagina}
          totalPaginas={paginas}
          basePath="/clientes"
          parametros={{ q: filtro.q, activo: planos.activo }}
        />
      </div>
    </div>
  );
}
