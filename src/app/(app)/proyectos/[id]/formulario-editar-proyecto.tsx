"use client";

import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input, Textarea } from "@/components/ui";

type DatosProyecto = {
  nombre: string;
  descripcion?: string;
  presupuesto?: string;
  fechaInicio: string;
  fechaFinEstimada?: string;
};

export function FormularioEditarProyecto({
  id,
  inicial,
}: {
  id: string;
  inicial: { nombre: string; descripcion: string | null; presupuesto: number | null; fechaInicio: string };
}) {
  const { enviar, errores, enviando } = useApiForm<DatosProyecto>(`/api/v1/proyectos/${id}`, "PATCH");

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    const ok = await enviar(
      {
        nombre: texto("nombre"),
        descripcion: texto("descripcion"),
        presupuesto: texto("presupuesto"),
        fechaInicio: texto("fechaInicio"),
        fechaFinEstimada: texto("fechaFinEstimada"),
      },
      {
        mensajeExito: "Proyecto actualizado.",
        alTerminar: () => formulario.closest("details")?.removeAttribute("open"),
      },
    );

    if (ok) {
      formulario.closest("details")?.removeAttribute("open");
    }
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Campo label="Nombre del proyecto" htmlFor="nombre" error={errores.nombre?.[0]} required>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={inicial.nombre}
            required
            invalido={Boolean(errores.nombre)}
          />
        </Campo>
      </div>

      <Campo label="Presupuesto (ARS)" htmlFor="presupuesto" error={errores.presupuesto?.[0]}>
        <Input
          id="presupuesto"
          name="presupuesto"
          type="number"
          min={0}
          step="0.01"
          defaultValue={inicial.presupuesto ?? ""}
          invalido={Boolean(errores.presupuesto)}
        />
      </Campo>

      <Campo label="Fecha de inicio" htmlFor="fechaInicio" error={errores.fechaInicio?.[0]}>
        <Input
          id="fechaInicio"
          name="fechaInicio"
          type="date"
          defaultValue={inicial.fechaInicio}
          invalido={Boolean(errores.fechaInicio)}
        />
      </Campo>

      <Campo label="Fin estimado" htmlFor="fechaFinEstimada" error={errores.fechaFinEstimada?.[0]}>
        <Input
          id="fechaFinEstimada"
          name="fechaFinEstimada"
          type="date"
          invalido={Boolean(errores.fechaFinEstimada)}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Campo label="Descripción" htmlFor="descripcion" error={errores.descripcion?.[0]}>
          <Textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            defaultValue={inicial.descripcion ?? ""}
            invalido={Boolean(errores.descripcion)}
          />
        </Campo>
      </div>

      <div className="sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
