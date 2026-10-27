import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Botones                                                                   */
/* -------------------------------------------------------------------------- */

type VarianteBoton = "primario" | "secundario" | "peligro" | "fantasma";

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    "bg-marca-600 text-white hover:bg-marca-700 disabled:bg-marca-600/50 border border-transparent",
  secundario:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  peligro: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 border border-transparent",
  fantasma: "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent",
};

export function Boton({
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBoton }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTES[variante],
        className,
      )}
    />
  );
}

export function BotonLink({
  href,
  variante = "secundario",
  children,
  className,
}: {
  href: string;
  variante?: VarianteBoton;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
        VARIANTES[variante],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Formularios                                                               */
/* -------------------------------------------------------------------------- */

const ESTILO_CONTROL =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/20 disabled:bg-slate-100";

export function Campo({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-red-600" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalido,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalido || undefined}
      className={cn(ESTILO_CONTROL, invalido && "border-red-400", className)}
    />
  );
}

export function Select({
  className,
  invalido,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalido?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalido || undefined}
      className={cn(ESTILO_CONTROL, invalido && "border-red-400", className)}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  invalido,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalido || undefined}
      className={cn(ESTILO_CONTROL, "min-h-20 resize-y", invalido && "border-red-400", className)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Estructura y presentación                                                 */
/* -------------------------------------------------------------------------- */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </section>
  );
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion ? <p className="mt-1 text-sm text-slate-600">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
    </div>
  );
}

type Tono = "neutral" | "exito" | "advertencia" | "peligro" | "info";

const TONOS: Record<Tono, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  exito: "bg-emerald-50 text-emerald-700 border-emerald-200",
  advertencia: "bg-amber-50 text-amber-800 border-amber-200",
  peligro: "bg-red-50 text-red-700 border-red-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function Etiqueta({ children, tono = "neutral" }: { children: ReactNode; tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        TONOS[tono],
      )}
    >
      {children}
    </span>
  );
}

export function EstadoVacio({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
    </div>
  );
}
