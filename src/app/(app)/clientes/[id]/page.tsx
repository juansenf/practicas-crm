import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotonLink, Card, EncabezadoPagina, Etiqueta } from "@/components/ui";
import { formatFecha, formatMoneda } from "@/lib/format";
import { isAppError } from "@/lib/errors";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";
import { clienteService } from "@/modules/clientes";
import { proyectoService } from "@/modules/proyectos";
import { AccionesCliente } from "./acciones-cliente";
import { FormularioCliente } from "../formulario-cliente";

export const metadata: Metadata = { title: "Ficha de cliente" };

const TONO_ESTADO: Record<string, "neutral" | "exito" | "advertencia" | "peligro" | "info"> = {
  PLANIFICADO: "info",
  EN_CURSO: "exito",
  PAUSADO: "advertencia",
  FINALIZADO: "neutral",
  CANCELADO: "peligro",
};

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");

  const { id } = await params;

  let cliente;
  try {
    cliente = await clienteService.obtener(actor, id);
  } catch (error) {
    if (isAppError(error) && error.code === "SIN_PERMISOS") redirect("/dashboard");
    notFound();
  }

  const interno = esRolInterno(actor);
  const proyectos = interno
    ? await proyectoService.listar(actor, { clienteId: cliente.id, pagina: 1, porPagina: 50 })
    : { items: [], total: 0 };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo={cliente.nombre}
        descripcion={cliente.email}
        acciones={
          <>
            {interno ? <BotonLink href="/clientes">Volver al listado</BotonLink> : null}
            {interno ? <AccionesCliente id={cliente.id} activo={cliente.activo} /> : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta tono={cliente.activo ? "exito" : "neutral"}>
          {cliente.activo ? "Activo" : "Inactivo"}
        </Etiqueta>
        <span className="text-xs text-slate-500">
          Alta: {formatFecha(cliente.creadoEn)} · Última actualización: {formatFecha(cliente.actualizadoEn)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Datos de contacto</h2>
          </header>
          <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">CUIT</dt>
              <dd className="mt-1 text-sm text-slate-900">{cliente.cuit ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-slate-900">{cliente.telefono ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Dirección</dt>
              <dd className="mt-1 text-sm text-slate-900">{cliente.direccion ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Notas internas</dt>
              <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">{cliente.notas ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Proyectos</h2>
          </header>
          <div className="px-5 py-5">
            <p className="text-3xl font-semibold tracking-tight">{proyectos.total}</p>
            <p className="text-sm text-slate-600">proyectos activos asociados</p>
            <BotonLink href={`/proyectos?clienteId=${cliente.id}`} className="mt-4 w-full">
              Ver proyectos
            </BotonLink>
          </div>
        </Card>
      </div>

      {interno ? (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900 marker:hidden">
            <span className="text-marca-600 group-open:hidden">Editar datos del cliente</span>
            <span className="hidden text-slate-500 group-open:inline">Cerrar formulario</span>
          </summary>
          <div className="border-t border-slate-100 px-5 py-5">
            <FormularioCliente
              cliente={{
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                cuit: cliente.cuit,
                telefono: cliente.telefono,
                direccion: cliente.direccion,
                notas: cliente.notas,
              }}
            />
          </div>
        </details>
      ) : null}

      <Card>
        <header className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Proyectos del cliente</h2>
        </header>
        {proyectos.items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Todavía no hay proyectos cargados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proyectos.items.map((proyecto) => (
              <li key={proyecto.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link
                  href={`/proyectos/${proyecto.id}`}
                  className="truncate text-sm font-medium text-slate-900 hover:text-marca-700"
                >
                  {proyecto.nombre}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-slate-500">{formatMoneda(proyecto.presupuesto)}</span>
                  <Etiqueta tono={TONO_ESTADO[proyecto.estado] ?? "neutral"}>
                    {proyecto.estado.replace("_", " ")}
                  </Etiqueta>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
