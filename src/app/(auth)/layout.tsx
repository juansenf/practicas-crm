import type { ReactNode } from "react";
import Link from "next/link";

export default function LayoutAuth({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="flex size-8 items-center justify-center rounded-lg bg-marca-600 text-sm font-bold text-white">
          N
        </span>
        Nexo
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-slate-500">
        Proyecto Integrador · Práctica Profesionalizante II · 2026
      </p>
    </main>
  );
}
