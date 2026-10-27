"use client";

import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input, Select, Textarea } from "@/components/ui";

type DatosProyecto = {
  nombre: string;
  clienteId: string;
  descripcion?: string;
  presupuesto?: string;
  fechaInicio: string;
  fechaFinEstimada?: string;
};

export function FormularioProyecto({
  clientes,
  clienteIdInicial,
}: {
  clientes: { id: string; nombre: string }[];
  clienteIdInicial?: string;
}) {
  const { enviar, errores, enviando } = useApiForm<DatosProyecto>("/api/v1/proyectos");

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    const ok = await enviar(
      {
        nombre: texto("nombre"),
        clienteId: texto("clienteId"),
        descripcion: texto("descripcion"),
        presupuesto: texto("presupuesto"),
        fechaInicio: texto("fechaInicio"),
        fechaFinEstimada: texto("fechaFinEstimada"),
      },
      {
        mensajeExito: "Proyecto creado correctamente.",
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
        <Campo label="Nombre del proyecto" htmlFor="nombre" error={errores.nombre?.[0]} required>
          <Input id="nombre" name="nombre" required invalido={Boolean(errores.nombre)} />
        </Campo>
      </div>

      <Campo label="Cliente" htmlFor="clienteId" error={errores.clienteId?.[0]} required>
        <Select
          id="clienteId"
          name="clienteId"
          required
          defaultValue={clienteIdInicial ?? ""}
          invalido={Boolean(errores.clienteId)}
        >
          <option value="">Seleccioná un cliente…</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo label="Presupuesto (ARS)" htmlFor="presupuesto" error={errores.presupuesto?.[0]}>
        <Input
          id="presupuesto"
          name="presupuesto"
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          invalido={Boolean(errores.presupuesto)}
        />
      </Campo>

      <Campo label="Fecha de inicio" htmlFor="fechaInicio" error={errores.fechaInicio?.[0]} required>
        <Input
          id="fechaInicio"
          name="fechaInicio"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
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
          <Textarea id="descripcion" name="descripcion" rows={3} invalido={Boolean(errores.descripcion)} />
        </Campo>
      </div>

      <div className="sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Crear proyecto"}
        </Boton>
      </div>
    </form>
  );
}
