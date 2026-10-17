import { IconCheck, IconClock } from "@/components/icons";

type Etapa = { titulo: string; detalle?: string; estado: "hecho" | "actual" | "pendiente" };

/**
 * Cómo sigue una venta conjunta después de la oferta: comprador → productores → martillero → cerrada.
 * El estado no depende solo del color: cada paso dice "Listo", "Ahora" o "Después".
 */
export function EtapasVenta({
  status,
  aceptaron,
  productores,
  comprador,
}: {
  status: string;
  aceptaron: number;
  productores: number;
  comprador?: string | null;
}) {
  const cerrada = status === "cerrado";
  const todos = productores > 0 && aceptaron >= productores;
  const etapas: Etapa[] = [
    { titulo: "Oferta del comprador", detalle: comprador ?? undefined, estado: "hecho" },
    {
      titulo: "Respuesta de los productores",
      detalle: `Aceptaron ${aceptaron} de ${productores}`,
      estado: cerrada || todos ? "hecho" : "actual",
    },
    {
      titulo: "Revisión y cierre del martillero",
      detalle: cerrada ? "Cerrada por el martillero" : todos ? "Está revisando la operación para cerrarla" : "Cuando acepten todos",
      estado: cerrada ? "hecho" : todos ? "actual" : "pendiente",
    },
    { titulo: "Venta cerrada", detalle: cerrada ? "Los animales quedan vendidos" : undefined, estado: cerrada ? "hecho" : "pendiente" },
  ];
  return (
    <ol className="etapas" aria-label="Cómo sigue la venta">
      {etapas.map((e) => (
        <li key={e.titulo} className={`etapa etapa-${e.estado}`}>
          <span className="etapa-ico" aria-hidden="true">
            {e.estado === "hecho" ? <IconCheck size={18} strokeWidth={3} /> : e.estado === "actual" ? <IconClock size={18} strokeWidth={2.6} /> : null}
          </span>
          <span>
            <strong>{e.titulo}</strong> <span className="etapa-tag">{e.estado === "hecho" ? "Listo" : e.estado === "actual" ? "Ahora" : "Después"}</span>
            {e.detalle ? <span className="small" style={{ display: "block" }}>{e.detalle}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
