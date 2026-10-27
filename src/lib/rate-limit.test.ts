import { describe, expect, it } from "vitest";
import { crearLimitador } from "./rate-limit";

describe("limitador de intentos", () => {
  it("permite hasta el máximo configurado", () => {
    const limitador = crearLimitador({ max: 3, ventanaMs: 1000 });

    expect(limitador.consumir("ip").permitido).toBe(true);
    expect(limitador.consumir("ip").permitido).toBe(true);
    expect(limitador.consumir("ip").permitido).toBe(true);
    expect(limitador.consumir("ip").permitido).toBe(false);
  });

  it("informa los intentos restantes", () => {
    const limitador = crearLimitador({ max: 3, ventanaMs: 1000 });

    expect(limitador.consumir("ip").restante).toBe(2);
    expect(limitador.consumir("ip").restante).toBe(1);
    expect(limitador.consumir("ip").restante).toBe(0);
  });

  it("separa los contadores por clave", () => {
    const limitador = crearLimitador({ max: 1, ventanaMs: 1000 });

    expect(limitador.consumir("a").permitido).toBe(true);
    expect(limitador.consumir("b").permitido).toBe(true);
    expect(limitador.consumir("a").permitido).toBe(false);
  });

  it("libera los intentos al vencer la ventana", () => {
    let ahora = 0;
    const limitador = crearLimitador({ max: 1, ventanaMs: 1000, ahora: () => ahora });

    expect(limitador.consumir("ip").permitido).toBe(true);
    expect(limitador.consumir("ip").permitido).toBe(false);

    ahora = 1500;

    expect(limitador.consumir("ip").permitido).toBe(true);
  });

  it("calcula los segundos de espera restantes", () => {
    let ahora = 0;
    const limitador = crearLimitador({ max: 1, ventanaMs: 10_000, ahora: () => ahora });

    limitador.consumir("ip");
    ahora = 4_000;

    expect(limitador.consumir("ip").reintentarEnSegundos).toBe(6);
  });

  it("reinicia el contador de una clave", () => {
    const limitador = crearLimitador({ max: 1, ventanaMs: 1000 });

    limitador.consumir("ip");
    limitador.reiniciar("ip");

    expect(limitador.consumir("ip").permitido).toBe(true);
  });
});
