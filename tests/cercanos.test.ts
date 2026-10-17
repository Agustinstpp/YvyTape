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
