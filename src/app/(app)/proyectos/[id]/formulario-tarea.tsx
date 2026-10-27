"use client";

import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input, Select, Textarea } from "@/components/ui";

type DatosTarea = {
  titulo: string;
  descripcion?: string;
  prioridad: string;
  fechaLimite?: string;
  horasEstimadas?: string;
  proyectoId: string;
  responsableId?: string;
};

export function FormularioTarea({
  proyectoId,
  responsables,
}: {
  proyectoId: string;
  responsables: { id: string; nombre: string }[];
}) {
  const { enviar, errores, enviando } = useApiForm<DatosTarea>("/api/v1/tareas");

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    const ok = await enviar(
      {
        titulo: texto("titulo"),
        descripcion: texto("descripcion"),
        prioridad: texto("prioridad") || "MEDIA",
        fechaLimite: texto("fechaLimite"),
        horasEstimadas: texto("horasEstimadas"),
        proyectoId,
        responsableId: texto("responsableId"),
      },
      {
        mensajeExito: "Tarea creada correctamente.",
        alTerminar: () => {
          formulario.reset();
          formulario.closest("details")?.removeAttribute("open");
        },
      },
    );

    if (!ok) return;
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Campo label="Título de la tarea" htmlFor="titulo" error={errores.titulo?.[0]} required>
          <Input
            id="titulo"
            name="titulo"
            required
            placeholder="Ej: Maquetar pantalla de login"
            invalido={Boolean(errores.titulo)}
          />
        </Campo>
      </div>

      <Campo label="Responsable" htmlFor="responsableId" error={errores.responsableId?.[0]}>
        <Select id="responsableId" name="responsableId" invalido={Boolean(errores.responsableId)}>
          <option value="">Sin asignar</option>
          {responsables.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo label="Prioridad" htmlFor="prioridad" error={errores.prioridad?.[0]}>
        <Select id="prioridad" name="prioridad" defaultValue="MEDIA" invalido={Boolean(errores.prioridad)}>
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
        </Select>
      </Campo>

      <Campo label="Fecha límite" htmlFor="fechaLimite" error={errores.fechaLimite?.[0]}>
        <Input
          id="fechaLimite"
          name="fechaLimite"
          type="date"
          invalido={Boolean(errores.fechaLimite)}
        />
      </Campo>

      <Campo label="Horas estimadas" htmlFor="horasEstimadas" error={errores.horasEstimadas?.[0]}>
        <Input
          id="horasEstimadas"
          name="horasEstimadas"
          type="number"
          min={0}
          step="0.5"
          invalido={Boolean(errores.horasEstimadas)}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Campo label="Descripción" htmlFor="descripcion" error={errores.descripcion?.[0]}>
          <Textarea id="descripcion" name="descripcion" rows={2} invalido={Boolean(errores.descripcion)} />
        </Campo>
      </div>

      <div className="sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Agregar tarea"}
        </Boton>
      </div>
    </form>
  );
}
