import { PoolStatus, CommercialEventType } from "@/lib/types/domain";

/**
 * Textos, descripciones y configuraciones visuales del motor comercial
 * adaptados a productores ganaderos mayores de 60 años.
 */

export interface PoolStatusPresentation {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
  hint: string;
}

export const POOL_STATUS_MAP: Record<PoolStatus, PoolStatusPresentation> = {
  abierto: {
    label: "Abierto",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-600",
    description: "Esta venta conjunta está reuniendo animales.",
    hint: "Podés sumar tus animales compatibles si disponés de un lote adecuado.",
  },
  objetivo_alcanzado: {
    label: "Objetivo alcanzado",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    dotClass: "bg-amber-600",
    description: "¡Se alcanzó el volumen objetivo! El pool puede recibir ofertas.",
    hint: "El grupo de animales está completo y listo para recibir propuestas de compradores.",
  },
  en_negociacion: {
    label: "En negociación",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    dotClass: "bg-blue-600",
    description: "Los productores están evaluando una propuesta comercial.",
    hint: "Se recibió una oferta de compra. Cada productor debe confirmar o rechazar su lote.",
  },
  cerrado: {
    label: "Operación cerrada",
    badgeClass: "bg-slate-200 text-slate-800 border-slate-300",
    dotClass: "bg-slate-600",
    description: "Esta operación fue cerrada en el entorno de demostración.",
    hint: "La venta conjunta completó su proceso de demostración con éxito.",
  },
  cancelado: {
    label: "Cancelado",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    dotClass: "bg-rose-600",
    description: "Esta venta conjunta ya no se encuentra disponible.",
    hint: "El pool fue retirado de la comercialización activa.",
  },
};

export function getPoolStatusPresentation(status: PoolStatus): PoolStatusPresentation {
  return (
    POOL_STATUS_MAP[status] || {
      label: status,
      badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
      dotClass: "bg-gray-500",
      description: "Estado comercial en seguimiento.",
      hint: "",
    }
  );
}

/**
 * Traduce eventos comerciales a un lenguaje claro y comprensible para el productor.
 */
export function formatCommercialEventText(
  eventType: CommercialEventType,
  details: Record<string, unknown> | null,
  actorName?: string
): { title: string; subtitle: string } {
  const actor = actorName || "Un participante";

  switch (eventType) {
    case "pool_created":
      return {
        title: "Venta conjunta iniciada",
        subtitle: `${actor} abrió esta venta conjunta con un objetivo de ${details?.target_heads || "determinado"} cabezas.`,
      };
    case "lot_joined":
      return {
        title: "Animales sumados al grupo",
        subtitle: `${actor} sumó ${details?.head_count || ""} cabezas. Total reunido: ${details?.total_heads_now || ""} cabezas.`,
      };
    case "lot_left":
      return {
        title: "Lote retirado",
        subtitle: `${actor} retiró un lote de ${details?.head_count || ""} cabezas.`,
      };
    case "pool_target_reached":
      return {
        title: "¡Objetivo de cabezas alcanzado!",
        subtitle: `Se reunieron las ${details?.target_heads || 400} cabezas requeridas. El pool ya puede recibir ofertas de compradores.`,
      };
    case "offer_created":
      return {
        title: "Nueva oferta indicativa recibida",
        subtitle: `Un comprador presentó una propuesta comercial de $ ${details?.price_per_kg || ""} por kilo.`,
      };
    case "offer_confirmed":
      return {
        title: "Propuesta aceptada por un productor",
        subtitle: `${actor} aceptó la propuesta comercial para sus animales.`,
      };
    case "offer_rejected":
      return {
        title: "Propuesta rechazada por un productor",
        subtitle: `${actor} rechazó la propuesta. La venta vuelve a buscar nuevas propuestas.`,
      };
    case "pool_closed":
      return {
        title: "Cierre comercial demostrativo registrado",
        subtitle: `El operador registró el cierre formal de la venta conjunta tras la aceptación unánime de los productores.`,
      };
    default:
      return {
        title: "Actividad comercial",
        subtitle: `Se registró una actualización en la venta conjunta.`,
      };
  }
}
