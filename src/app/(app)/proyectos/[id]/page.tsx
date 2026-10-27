import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotonLink, Card, EncabezadoPagina, Etiqueta } from "@/components/ui";
import { aInputFecha, formatFecha, formatFechaHora, formatMoneda } from "@/lib/format";
import { isAppError } from "@/lib/errors";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";
import { proyectoService } from "@/modules/proyectos";
import { TRANSICIONES_PROYECTO } from "@/modules/proyectos/service";
import { estadoProyectoTono } from "@/modules/proyectos/presentacion";
import { tareaService } from "@/modules/tareas";
import { TRANSICIONES_TAREA } from "@/modules/tareas/service";
import { listarUsuariosInternos } from "@/modules/usuarios";
import { AccionesProyecto } from "./acciones-proyecto";
import { AccionesTarea } from "./acciones-tarea";
import { FormularioEditarProyecto } from "./formulario-editar-proyecto";
import { FormularioTarea } from "./formulario-tarea";

export const metadata: Metadata = { title: "Detalle de proyecto" };

const TONO_PRIORIDAD: Record<string, "neutral" | "exito" | "advertencia" | "peligro" | "info"> = {
  BAJA: "neutral",
  MEDIA: "info",
  ALTA: "peligro",
};

export default async function PaginaProyecto({ params }: { params: Promise<{ id: string }> }) {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");

  const { id } = await params;

  let proyecto;
  try {
    proyecto = await proyectoService.obtener(actor, id);
  } catch (error) {
    if (isAppError(error) && error.code === "SIN_PERMISOS") redirect("/dashboard");
    notFound();
  }

  const interno = esRolInterno(actor);
  const [tareas, responsables] = await Promise.all([
    tareaService.listar(actor, { proyectoId: proyecto.id, pagina: 1, porPagina: 100 }),
    interno ? listarUsuariosInternos() : Promise.resolve([]),
  ]);

  const completadas = tareas.items.filter((tarea) => tarea.estado === "COMPLETADA").length;
  const proyectoEditable = proyecto.activo && proyecto.estado !== "FINALIZADO" && proyecto.estado !== "CANCELADO";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/proyectos" className="font-medium text-marca-600 hover:text-marca-700">
          Proyectos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">{proyecto.nombre}</span>
      </div>

      <EncabezadoPagina
        titulo={proyecto.nombre}
        descripcion={`Cliente: ${proyecto.cliente.nombre}`}
        acciones={
          <>
            <Etiqueta tono={estadoProyectoTono(proyecto.estado)}>{proyecto.estado.replace("_", " ")}</Etiqueta>
            {!proyecto.activo ? <Etiqueta tono="peligro">Dado de baja</Etiqueta> : null}
            <BotonLink href={`/clientes/${proyecto.clienteId}`}>Ver cliente</BotonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Información del proyecto</h2>
          </header>
          <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Presupuesto</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatMoneda(proyecto.presupuesto)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Avance</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {completadas} de {tareas.total} tareas completadas
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Inicio</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatFecha(proyecto.fechaInicio)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Fin estimado</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatFecha(proyecto.fechaFinEstimada)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Descripción</dt>
              <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">
                {proyecto.descripcion ?? "Sin descripción."}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Última actualización</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatFechaHora(proyecto.actualizadoEn)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Gestión</h2>
          </header>
          <div className="px-5 py-5">
            {interno && proyecto.activo ? (
              <AccionesProyecto
                id={proyecto.id}
                estado={proyecto.estado}
                permitidos={TRANSICIONES_PROYECTO[proyecto.estado]}
              />
            ) : (
              <p className="text-sm text-slate-500">
                Este proyecto es de solo lectura para tu perfil.
              </p>
            )}
          </div>
        </Card>
      </div>

      {interno && proyectoEditable ? (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900 marker:hidden">
            <span className="text-marca-600 group-open:hidden">Editar proyecto</span>
            <span className="hidden text-slate-500 group-open:inline">Cerrar formulario</span>
          </summary>
          <div className="border-t border-slate-100 px-5 py-5">
            <FormularioEditarProyecto
              id={proyecto.id}
              inicial={{
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion,
                presupuesto: proyecto.presupuesto,
                fechaInicio: aInputFecha(proyecto.fechaInicio),
              }}
            />
          </div>
        </details>
      ) : null}

      <Card>
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Tareas</h2>
          <span className="text-xs text-slate-500">
            {tareas.total} tarea{tareas.total === 1 ? "" : "s"} · {completadas} completada
            {completadas === 1 ? "" : "s"}
          </span>
        </header>

        {tareas.items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Todavía no hay tareas en este proyecto.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tarea</th>
                  <th className="px-5 py-3 font-semibold">Responsable</th>
                  <th className="px-5 py-3 font-semibold">Prioridad</th>
                  <th className="px-5 py-3 font-semibold">Vence</th>
                  <th className="px-5 py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tareas.items.map((tarea) => (
                  <tr key={tarea.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{tarea.titulo}</p>
                      {tarea.descripcion ? (
                        <p className="max-w-md truncate text-xs text-slate-500">{tarea.descripcion}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{tarea.responsable?.nombre ?? "Sin asignar"}</td>
                    <td className="px-5 py-3">
                      <Etiqueta tono={TONO_PRIORIDAD[tarea.prioridad] ?? "neutral"}>{tarea.prioridad}</Etiqueta>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatFecha(tarea.fechaLimite)}</td>
                    <td className="px-5 py-3 text-right">
                      <AccionesTarea
                        id={tarea.id}
                        estado={tarea.estado}
                        permitidos={TRANSICIONES_TAREA[tarea.estado]}
                        editable={interno && tarea.proyecto.estado !== "CANCELADO"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {interno && proyectoEditable ? (
          <details className="group border-t border-slate-100">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900 marker:hidden">
              <span className="text-marca-600 group-open:hidden">+ Agregar tarea</span>
              <span className="hidden text-slate-500 group-open:inline">Cerrar formulario</span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-5">
              <FormularioTarea proyectoId={proyecto.id} responsables={responsables} />
            </div>
          </details>
        ) : null}
      </Card>
    </div>
  );
}
