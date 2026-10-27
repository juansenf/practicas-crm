"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useApiForm } from "@/components/use-api-form";
import { Boton, Campo, Input } from "@/components/ui";

type Credenciales = { email: string; password: string };

export function FormularioLogin({ redirectA }: { redirectA: string }) {
  const { enviar, errores, enviando } = useApiForm<Credenciales>("/api/v1/auth/login");
  const router = useRouter();

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const ok = await enviar(
      {
        email: String(datos.get("email") ?? ""),
        password: String(datos.get("password") ?? ""),
      },
      { mensajeExito: "Sesión iniciada correctamente." },
    );

    if (ok) {
      router.replace(redirectA);
      router.refresh();
    }
  }

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <Campo label="Email" htmlFor="email" error={errores.email?.[0]} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vos@empresa.com"
          invalido={Boolean(errores.email)}
        />
      </Campo>

      <Campo label="Contraseña" htmlFor="password" error={errores.password?.[0]} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••"
          invalido={Boolean(errores.password)}
        />
      </Campo>

      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
