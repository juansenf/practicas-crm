import type { Metadata } from "next";
import Link from "next/link";
import { SwaggerUI } from "./swagger-ui";

export const metadata: Metadata = {
  title: "Documentación de la API",
  description: "Contrato OpenAPI 3.1 y consola interactiva de la API de Nexo.",
};

export default function PaginaDocs() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              API Nexo · Documentación
            </h1>
            <p className="text-sm text-slate-600">
              Contrato OpenAPI 3.1 generado a partir de los route handlers de{" "}
              <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">/api/v1</code>.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/openapi.yaml"
              className="font-medium text-marca-600 hover:text-marca-700"
              download
            >
              Descargar openapi.yaml
            </a>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Volver al sistema
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-6">
        <SwaggerUI />
      </main>
    </div>
  );
}
