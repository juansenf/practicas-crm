"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input } from "@/components/ui";

type Registro = { nombre: string; empresa: string; email: string; password: string };

export function FormularioRegistro() {
  const { enviar, errores, enviando } = useApiForm<Registro>("/api/v1/auth/registro");
  const router = useRouter();

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    const ok = await enviar(
      {
        nombre: String(datos.get("nombre") ?? ""),
        empresa: String(datos.get("empresa") ?? ""),
        email: String(datos.get("email") ?? ""),
        password: String(datos.get("password") ?? ""),
      },
      { mensajeExito: "Tu cuenta fue creada. ¡Bienvenido!" },
    );

    if (ok) {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <Campo label="Nombre y apellido" htmlFor="nombre" error={errores.nombre?.[0]} required>
        <Input
          id="nombre"
          name="nombre"
          autoComplete="name"
          required
          placeholder="Ana Pérez"
          invalido={Boolean(errores.nombre)}
        />
      </Campo>

      <Campo label="Empresa" htmlFor="empresa" error={errores.empresa?.[0]} required>
        <Input
          id="empresa"
          name="empresa"
          required
          placeholder="Estudio Pérez SRL"
          invalido={Boolean(errores.empresa)}
        />
      </Campo>

      <Campo label="Email" htmlFor="email" error={errores.email?.[0]} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ana@estudioperez.com"
          invalido={Boolean(errores.email)}
        />
      </Campo>

      <Campo
        label="Contraseña"
        htmlFor="password"
        error={errores.password?.[0]}
        hint="Mínimo 10 caracteres, con al menos una letra y un número."
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          invalido={Boolean(errores.password)}
        />
      </Campo>

      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </Boton>
    </form>
  );
}
