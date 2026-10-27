"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TipoToast = "exito" | "error" | "info";

type Toast = {
  id: number;
  tipo: TipoToast;
  mensaje: string;
};

type ToastContextValue = {
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ESTILOS: Record<TipoToast, string> = {
  exito: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-slate-200 bg-white text-slate-900",
};

const ICONOS: Record<TipoToast, string> = {
  exito: "✓",
  error: "!",
  info: "i",
};

/**
 * Notificaciones no bloqueantes para dar feedback de cada operación
 * (éxito, error controlado o advertencia), sin recargar la página.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: TipoToast = "exito") => {
    const id = Date.now() + Math.random();
    setToasts((actuales) => [...actuales, { id, tipo, mensaje }]);
    window.setTimeout(() => {
      setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm",
              ESTILOS[toast.tipo],
            )}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-bold">
              {ICONOS[toast.tipo]}
            </span>
            <p className="leading-snug">{toast.mensaje}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return contexto;
}
