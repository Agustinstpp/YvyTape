import { describe, it, expect } from "vitest";
import { cercanosPara, masCercanosQueCompletan, offsetKm } from "@/lib/front/cercanos";
import { parseNumero } from "@/lib/ui/format";

const lote = (id: string, producer_id: string, zone: string, head_count: number, category = "novillo") =>
  ({ id, producer_id, head_count, category, farm: { id: "f" + id, name: "Campo", zone, province: "Corrientes" } }) as never;

describe("completar la venta", () => {
  const venta = { zone: "Curuzú Cuatiá", category: "novillo", target_heads: 400, current_heads: 350, members: [{ lot_id: "ya" }] } as never;

  it("calcula distancias razonables entre localidades", () => {
    expect(offsetKm("Curuzú Cuatiá", "Mercedes").km).toBeGreaterThan(50);
    expect(offsetKm("Curuzú Cuatiá", "Curuzú Cuatiá").km).toBe(0);
  });

  it("deja afuera lo propio, lo que ya está en la venta, otra categoría y lo lejano", () => {
    const res = cercanosPara(venta, [
      lote("a", "otro", "Curuzú Cuatiá", 50),
      lote("b", "yo", "Curuzú Cuatiá", 30),
      lote("ya", "otro", "Curuzú Cuatiá", 20),
      lote("c", "otro", "Curuzú Cuatiá", 40, "ternero"),
      lote("d", "otro", "Ituzaingó", 80),
    ], "yo");
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ cabezas: 50, mismaZona: true });
    expect(masCercanosQueCompletan(res, 50)).toHaveLength(1);
    expect(masCercanosQueCompletan(res, 60)).toHaveLength(0);
  });
});

describe("parseNumero", () => {
  it("entiende números escritos a la argentina", () => {
    expect(parseNumero("2.850")).toBe(2850);
    expect(parseNumero("180,5")).toBe(180.5);
    expect(parseNumero("180.5")).toBe(180.5);
    expect(parseNumero("2.850,50")).toBe(2850.5);
  });
});

import { areZonesCompatible } from "@/lib/front/zonas";
import { lotesCompatibles } from "@/lib/front/cercanos";
describe("completar la venta usa la misma regla de zonas que el backend", () => {
  it("acepta misma zona con o sin tildes y los pares vecinos", () => {
    expect(areZonesCompatible("Curuzú Cuatiá", "curuzu cuatia")).toBe(true);
    expect(areZonesCompatible("Curuzú Cuatiá", "Mercedes")).toBe(true);
    expect(areZonesCompatible("Goya", "Mercedes")).toBe(false);
  });
  it("lotesCompatibles deja solo lotes ajenos, de la categoría y zona compatible", () => {
    const venta = { zone: "Curuzú Cuatiá", category: "novillo", members: [] } as never;
    const l = (id: string, p: string, zone: string, category = "novillo") =>
      ({ id, producer_id: p, category, head_count: 10, farm: { zone } }) as never;
    const res = lotesCompatibles(venta, [l("a", "x", "Mercedes"), l("b", "yo", "Mercedes"), l("c", "x", "Goya"), l("d", "x", "Mercedes", "ternero")], "yo");
    expect(res.map((r: { id: string }) => r.id)).toEqual(["a"]);
  });
});

import { lotesQueEntran } from "@/lib/front/derivados";
describe("lotesQueEntran (productor que completa una venta)", () => {
  const pool = { status: "abierto", category: "novillo", zone: "Curuzú Cuatiá", current_heads: 350, target_heads: 400 } as never;
  const l = (id: string, head_count: number, zone = "Curuzú Cuatiá", status = "disponible", category = "novillo") =>
    ({ id, head_count, status, category, farm: { zone } }) as never;
  it("ofrece los lotes que entran en lo que falta, de zona compatible", () => {
    const r = lotesQueEntran(pool, [l("a", 50), l("b", 60), l("c", 40, "Mercedes"), l("d", 30, "Goya"), l("e", 20, "Curuzú Cuatiá", "reservado")]);
    expect(r.map((x: { id: string }) => x.id)).toEqual(["a", "c"]);
  });
  it("no ofrece nada si la venta ya no está abierta", () => {
    expect(lotesQueEntran({ ...(pool as object), status: "objetivo_alcanzado" } as never, [l("a", 10)])).toEqual([]);
  });
});
