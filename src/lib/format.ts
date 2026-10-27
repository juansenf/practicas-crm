// Las fechas de negocio (fechaInicio, fechaLimite, etc.) se guardan como
// medianoche UTC, por lo que se formatean en UTC para no mostrar el día anterior
// en husos horarios negativos como America/Argentina/Buenos_Aires.
const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const formatoFechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return formatoFecha.format(new Date(fecha));
}

export function formatFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return formatoFechaHora.format(new Date(fecha));
}

export function formatMoneda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return formatoMoneda.format(valor);
}

/** Convierte un Date al formato YYYY-MM-DD que espera un <input type="date">. */
export function aInputFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "";
  return new Date(fecha).toISOString().slice(0, 10);
}
