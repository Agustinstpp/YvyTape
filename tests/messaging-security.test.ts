import { describe, it, expect } from "vitest";
import { containsContactInfo, CONTACT_INFO_ERROR } from "@/lib/front/contact-filter";
import { mensajes } from "@/lib/front/mensajes";
import { Profile } from "@/lib/types/domain";

describe("Fase 2 — Mensajería y Seguridad Anti-Desintermediación", () => {
  const mockProductorA: Profile = {
    id: "11111111-1111-4000-8000-000000000001",
    full_name: "Don Juan Romero",
    role: "productor",
    zone: "Curuzú Cuatiá",
    phone: null,
    created_at: new Date().toISOString(),
  };

  const mockComprador: Profile = {
    id: "22222222-2222-4000-8000-000000000001",
    full_name: "Frigorífico del Litoral",
    role: "comprador",
    zone: "Corrientes Capital",
    phone: null,
    created_at: new Date().toISOString(),
  };

  describe("1. Filtro de contacto en el servidor (anti-desintermediación)", () => {
    it("detecta y bloquea números telefónicos argentinos en cualquier formato", () => {
      expect(containsContactInfo("Llamame al 3774-123456")).toBe(true);
      expect(containsContactInfo("Mi whatsapp es +54 9 379 4556677")).toBe(true);
      expect(containsContactInfo("Escribime al 3774445566")).toBe(true);
      expect(containsContactInfo("11 2345 6789")).toBe(true);
    });

    it("detecta y bloquea correos electrónicos", () => {
      expect(containsContactInfo("Mi email es juan@romero.com.ar")).toBe(true);
      expect(containsContactInfo("Escribí a contacto@frigorifico.com")).toBe(true);
    });

    it("detecta y bloquea enlaces y dominios web", () => {
      expect(containsContactInfo("Mirá mi campo en https://micampo.com")).toBe(true);
      expect(containsContactInfo("Entrá a www.ganaderia.com.ar")).toBe(true);
    });

    it("permite mensajes comerciales legítimos sobre peso, raza, cabezas y precios", () => {
      expect(containsContactInfo("Tenemos 80 novillos Braford de 390 kg listos para entrega")).toBe(false);
      expect(containsContactInfo("El precio pretendido es $2.850 por kg vivo")).toBe(false);
      expect(containsContactInfo("¿Cuándo pueden coordinar la carga en la venta conjunta?")).toBe(false);
    });
  });

  describe("2. Ciclo de vida y validaciones de mensajes", () => {
    it("rechaza el inicio de una conversación si contiene datos de contacto en el texto", async () => {
      const res = await mensajes.iniciar(mockProductorA, {
        asunto: "Consulta comercial",
        contexto: "Venta conjunta",
        texto: "Llamame a mi celu 3774-456789 para arreglar directo",
      });

      expect(res.data).toBeUndefined();
      expect(res.error).toBe(CONTACT_INFO_ERROR);
    });

    it("rechaza el inicio de una conversación si contiene datos de contacto en el asunto", async () => {
      const res = await mensajes.iniciar(mockProductorA, {
        asunto: "Llamame al 3774-998877",
        contexto: "Venta conjunta",
        texto: "Consulta sobre los animales disponibles",
      });

      expect(res.data).toBeUndefined();
      expect(res.error).toBe(CONTACT_INFO_ERROR);
    });

    it("permite iniciar una conversación legítima y responder sin datos de contacto", async () => {
      const res = await mensajes.iniciar(mockProductorA, {
        asunto: "Disponibilidad de carga",
        contexto: "Venta Curuzú Cuatiá",
        texto: "Hola martillero: ¿a qué hora llega el camión jaula para la pesada?",
      });

      expect(res.data).toBeDefined();
      expect(typeof res.data?.id).toBe("string");

      const convId = res.data!.id;

      // Responder en la conversación
      const reply = await mensajes.enviar(mockComprador, convId, "Se estima la carga a primera hora de la mañana.");
      expect(reply.data).toBeDefined();

      // Abrir conversación
      const conv = await mensajes.conversacion(mockProductorA, convId);
      expect(conv).not.toBeNull();
      expect(conv?.mensajes.length).toBeGreaterThanOrEqual(2);
    });
  });
});
