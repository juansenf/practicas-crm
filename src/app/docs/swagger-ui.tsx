"use client";

import { useEffect, useRef } from "react";

type SwaggerUIBundleFn = (config: Record<string, unknown>) => unknown;

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleFn;
  }
}

const SRC_BUNDLE = "/docs/swagger-ui/swagger-ui-bundle.js";

/**
 * Swagger UI servido localmente (sin CDN) para que funcione con la CSP
 * `default-src 'self'` y también en entornos sin acceso a internet.
 */
export function SwaggerUI() {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;

    function inicializar() {
      if (cancelado || !window.SwaggerUIBundle || !contenedor.current) return;
      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        domNode: contenedor.current,
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 0,
        tryItOutEnabled: true,
        persistAuthorization: true,
        withCredentials: true,
      });
    }

    const existente = document.querySelector<HTMLScriptElement>(`script[src="${SRC_BUNDLE}"]`);
    if (existente) {
      if (window.SwaggerUIBundle) inicializar();
      else existente.addEventListener("load", inicializar);
      return () => existente.removeEventListener("load", inicializar);
    }

    const script = document.createElement("script");
    script.src = SRC_BUNDLE;
    script.async = true;
    script.addEventListener("load", inicializar);
    document.body.appendChild(script);

    return () => {
      cancelado = true;
      script.removeEventListener("load", inicializar);
    };
  }, []);

  return (
    <>
      {/* El CSS de Swagger UI se sirve localmente; no se puede importar como módulo. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/docs/swagger-ui/swagger-ui.css" />
      <div ref={contenedor} className="swagger-ui-wrapper" />
    </>
  );
}
