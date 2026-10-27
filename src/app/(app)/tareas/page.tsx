import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boton, Card, EncabezadoPagina, EstadoVacio, Etiqueta, Input, Select } from "@/components/ui";
import { Paginacion } from "@/components/paginacion";
import { formatFecha } from "@/lib/format";
import { obtenerActor } from "@/modules/auth/session";
import { tareaService } from "@/modules/tareas";
import { filtroTareasSchema, estadosTarea, prioridades } from "@/modules/tareas/schema";

export const metadata: Metadata = { title: "Tareas" };

const TONO_ESTADO: Record<string, "neutral" | "exito" | "advertencia" | "peligro" | "info"> = {
  PENDIENTE: "info",
  EN_PROGRESO: "exito",
  BLOQUEADA: "advertencia",
  COMPLETADA: "neutral",
};

const TONO_PRIORIDAD: Record<string, "neutral" | "exito" | "advertencia" | "peligro" | "info"> = {
  BAJA: "neutral",
  MEDIA: "info",
  ALTA: "peligro",
};

export default async function PaginaTareas({
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

  const parseado = filtroTareasSchema.safeParse(planos);
  const filtro = parseado.success ? parseado.data : { pagina: 1, porPagina: 10 };
  const tareas = await tareaService.listar(actor, filtro);

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Tareas"
        descripcion="Listado consolidado de tareas de todos los proyectos."
      />

      <form method="get" className="flex flex-col gap-2 sm:flex-row" role="search">
        <Input
          name="q"
          placeholder="Buscar por título o descripción…"
          defaultValue={filtro.q ?? ""}
          aria-label="Buscar tareas"
          className="sm:max-w-sm"
        />
        <Select name="estado" defaultValue={planos.estado ?? ""} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {estadosTarea.map((estado) => (
            <option key={estado} value={estado}>
              {estado.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Select name="prioridad" defaultValue={planos.prioridad ?? ""} aria-label="Filtrar por prioridad">
          <option value="">Toda prioridad</option>
          {prioridades.map((prioridad) => (
            <option key={prioridad} value={prioridad}>
              {prioridad}
            </option>
          ))}
        </Select>
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      <Card>
        {tareas.items.length === 0 ? (
          <div className="p-5">
            <EstadoVacio titulo="No hay tareas para mostrar" descripcion="Ajustá los filtros o creá tareas desde un proyecto." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tarea</th>
                  <th className="px-5 py-3 font-semibold">Proyecto</th>
                  <th className="px-5 py-3 font-semibold">Responsable</th>
                  <th className="px-5 py-3 font-semibold">Prioridad</th>
                  <th className="px-5 py-3 font-semibold">Vence</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tareas.items.map((tarea) => (
                  <tr key={tarea.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900">{tarea.titulo}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/proyectos/${tarea.proyecto.id}`}
                        className="text-slate-600 hover:text-marca-700"
                      >
                        {tarea.proyecto.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{tarea.responsable?.nombre ?? "Sin asignar"}</td>
                    <td className="px-5 py-3">
                      <Etiqueta tono={TONO_PRIORIDAD[tarea.prioridad] ?? "neutral"}>{tarea.prioridad}</Etiqueta>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatFecha(tarea.fechaLimite)}</td>
                    <td className="px-5 py-3">
                      <Etiqueta tono={TONO_ESTADO[tarea.estado] ?? "neutral"}>
                        {tarea.estado.replace("_", " ")}
                      </Etiqueta>
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
          {tareas.total} tarea{tareas.total === 1 ? "" : "s"} encontrada{tareas.total === 1 ? "" : "s"}
        </p>
        <Paginacion
          pagina={tareas.pagina}
          totalPaginas={tareas.totalPaginas}
          basePath="/tareas"
          parametros={{ q: filtro.q, estado: planos.estado, prioridad: planos.prioridad }}
        />
      </div>
    </div>
  );
}
