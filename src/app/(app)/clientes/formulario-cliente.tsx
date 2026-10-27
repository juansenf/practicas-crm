"use client";

import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input, Textarea } from "@/components/ui";

export type ClienteInicial = {
  id: string;
  nombre: string;
  email: string;
  cuit: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
};

type DatosCliente = {
  nombre: string;
  email: string;
  cuit?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
};

export function FormularioCliente({
  cliente,
  alGuardar,
}: {
  cliente?: ClienteInicial;
  alGuardar?: () => void;
}) {
  const editando = Boolean(cliente);
  const { enviar, errores, enviando } = useApiForm<DatosCliente>(
    editando ? `/api/v1/clientes/${cliente!.id}` : "/api/v1/clientes",
    editando ? "PATCH" : "POST",
  );

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    const ok = await enviar(
      {
        nombre: texto("nombre"),
        email: texto("email"),
        cuit: texto("cuit"),
        telefono: texto("telefono"),
        direccion: texto("direccion"),
        notas: texto("notas"),
      },
      {
        mensajeExito: editando ? "Cliente actualizado." : "Cliente creado correctamente.",
        alTerminar: () => {
          if (!editando) {
            formulario.reset();
            formulario.closest("details")?.removeAttribute("open");
          }
          alGuardar?.();
        },
      },
    );

    if (ok && editando) {
      formulario.closest("details")?.removeAttribute("open");
    }
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Campo label="Nombre o razón social" htmlFor="nombre" error={errores.nombre?.[0]} required>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={cliente?.nombre}
            required
            invalido={Boolean(errores.nombre)}
          />
        </Campo>
      </div>

      <Campo label="Email" htmlFor="email" error={errores.email?.[0]} required>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={cliente?.email}
          required
          invalido={Boolean(errores.email)}
        />
      </Campo>

      <Campo label="CUIT" htmlFor="cuit" error={errores.cuit?.[0]} hint="11 dígitos, con o sin guiones.">
        <Input id="cuit" name="cuit" defaultValue={cliente?.cuit ?? ""} invalido={Boolean(errores.cuit)} />
      </Campo>

      <Campo label="Teléfono" htmlFor="telefono" error={errores.telefono?.[0]}>
        <Input
          id="telefono"
          name="telefono"
          defaultValue={cliente?.telefono ?? ""}
          invalido={Boolean(errores.telefono)}
        />
      </Campo>

      <Campo label="Dirección" htmlFor="direccion" error={errores.direccion?.[0]}>
        <Input
          id="direccion"
          name="direccion"
          defaultValue={cliente?.direccion ?? ""}
          invalido={Boolean(errores.direccion)}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Campo label="Notas internas" htmlFor="notas" error={errores.notas?.[0]}>
          <Textarea
            id="notas"
            name="notas"
            defaultValue={cliente?.notas ?? ""}
            rows={3}
            invalido={Boolean(errores.notas)}
          />
        </Campo>
      </div>

      <div className="sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cliente"}
        </Boton>
      </div>
    </form>
  );
}
