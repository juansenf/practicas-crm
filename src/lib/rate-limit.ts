export type ResultadoLimite = {
  permitido: boolean;
  restante: number;
  reintentarEnSegundos: number;
};

/**
 * Limitador de intentos en memoria (ventana deslizante).
 *
 * Nota de arquitectura: en un despliegue serverless cada instancia tiene su
 * propia memoria, por lo que este control es "best effort". Para producción a
 * escala debe reemplazarse por un almacén compartido (Redis/Upstash). Se deja
 * la interfaz desacoplada para permitir ese cambio sin tocar el servicio.
 */
export function crearLimitador(opciones: {
  max: number;
  ventanaMs: number;
  ahora?: () => number;
}) {
  const { max, ventanaMs, ahora = () => Date.now() } = opciones;
  const intentos = new Map<string, number[]>();

  return {
    consumir(clave: string): ResultadoLimite {
      const ahoraMs = ahora();
      const vigentes = (intentos.get(clave) ?? []).filter((t) => ahoraMs - t < ventanaMs);

      if (vigentes.length >= max) {
        const masAntiguo = vigentes[0] ?? ahoraMs;
        const reintentarEnSegundos = Math.max(1, Math.ceil((masAntiguo + ventanaMs - ahoraMs) / 1000));
        intentos.set(clave, vigentes);
        return { permitido: false, restante: 0, reintentarEnSegundos };
      }

      vigentes.push(ahoraMs);
      intentos.set(clave, vigentes);
      return { permitido: true, restante: max - vigentes.length, reintentarEnSegundos: 0 };
    },

    reiniciar(clave: string): void {
      intentos.delete(clave);
    },
  };
}

export type Limitador = ReturnType<typeof crearLimitador>;
