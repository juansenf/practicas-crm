"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui";

export function BotonSalir() {
  const [saliendo, setSaliendo] = useState(false);
  const router = useRouter();

  async function salir() {
    setSaliendo(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Boton variante="fantasma" onClick={salir} disabled={saliendo} className="w-full justify-start">
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </Boton>
  );
}
