import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoPagina, Etiqueta } from "@/components/ui";
import { prisma } from "@/lib/db";
import { esRolInterno } from "@/modules/auth/policy";
import { obtenerActor } from "@/modules/auth/session";
import { formatFecha, formatMoneda } from "@/lib/format";

export const metadata: Metadata = { title: "Panel" };

const TONO_ESTADO: Record<string, "neutral" | "exito" | "advertencia" | "peligro" | "info"> = {
  PLANIFICADO: "info",
  EN_CURSO: "exito",
  PAUSADO: "advertencia",
  FINALIZADO: "neutral",
  CANCELADO: "peligro",
};

export default async function PaginaPanel() {
  const actor = await obtenerActor();
  if (!actor) redirect("/login");

  const interno = esRolInterno(actor);
  const filtroCliente = interno ? {} : { clienteId: actor.clienteId ?? "__sin_cliente__" };

  const [clientesActivos, proyectosEnCurso, tareasPendientes, proyectos, tareas] = await Promise.all([
    interno ? prisma.cliente.count({ where: { activo: true } }) : Promise.resolve(null),
    prisma.proyecto.count({ where: { ...filtroCliente, activo: true, estado: "EN_CURSO" } }),
    prisma.tarea.count({
      where: { activo: true, estado: { in: ["PENDIENTE", "EN_PROGRESO", "BLOQUEADA"] }, proyecto: filtroCliente },
    }),
    prisma.proyecto.findMany({
      where: { ...filtroCliente, activo: true },
      select: {
        id: true,
        nombre: true,
        estado: true,
        presupuesto: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { actualizadoEn: "desc" },
      take: 5,
    }),
    prisma.tarea.findMany({
      where: { activo: true, estado: { not: "COMPLETADA" }, proyecto: filtroCliente },
      select: {
        id: true,
        titulo: true,
        estado: true,
        fechaLimite: true,
        prioridad: true,
        proyecto: { select: { nombre: true } },
      },
      orderBy: [{ fechaLimite: "asc" }, { prioridad: "desc" }],
      take: 6,
    }),
  ]);

  const metricas = [
    ...(clientesActivos !== null ? [{ etiqueta: "Clientes activos", valor: clientesActivos }] : []),
    { etiqueta: "Proyectos en curso", valor: proyectosEnCurso },
    { etiqueta: "Tareas abiertas", valor: tareasPendientes },
  ];

  return (
    <div className="space-y-8">
      <EncabezadoPagina
        titulo={`Hola, ${actor.nombre.split(" ")[0]}`}
        descripcion={
          interno
            ? "Resumen de la cartera de clientes y proyectos del estudio."
            : "Seguimiento de los proyectos y tareas de tu empresa."
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {metricas.map((metrica) => (
          <div key={metrica.etiqueta} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">{metrica.etiqueta}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{metrica.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Proyectos recientes</h2>
            <Link href="/proyectos" className="text-sm font-medium text-marca-600 hover:text-marca-700">
              Ver todos
            </Link>
          </header>
          <ul className="divide-y divide-slate-100">
            {proyectos.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-slate-500">Sin proyectos cargados.</li>
            ) : (
              proyectos.map((proyecto) => (
                <li key={proyecto.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/proyectos/${proyecto.id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-marca-700"
                    >
                      {proyecto.nombre}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{proyecto.cliente.nombre}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Etiqueta tono={TONO_ESTADO[proyecto.estado] ?? "neutral"}>
                      {proyecto.estado.replace("_", " ")}
                    </Etiqueta>
                    <span className="text-xs text-slate-500">
                      {proyecto.presupuesto ? formatMoneda(Number(proyecto.presupuesto)) : "Sin presupuesto"}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Próximas tareas</h2>
            <Link href="/tareas" className="text-sm font-medium text-marca-600 hover:text-marca-700">
              Ver todas
            </Link>
          </header>
          <ul className="divide-y divide-slate-100">
            {tareas.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-slate-500">No hay tareas pendientes.</li>
            ) : (
              tareas.map((tarea) => (
                <li key={tarea.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-900">{tarea.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tarea.proyecto.nombre}
                    {tarea.fechaLimite ? ` · vence ${formatFecha(tarea.fechaLimite)}` : " · sin fecha límite"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
