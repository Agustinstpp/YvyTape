import { z } from "zod";

export const OFFER_STATUSES = ["pendiente", "aceptada", "rechazada"] as const;

export const createOfferSchema = z.object({
  price_per_kg: z
    .number({ invalid_type_error: "El precio por kg debe ser un número" })
    .positive("El precio por kg debe ser mayor a 0")
    .max(100000, "El precio por kg excede el rango admitido"),
});

export const confirmOfferSchema = z.object({
  offer_id: z.string().uuid("ID de oferta no válido"),
  accepted: z.boolean({
    invalid_type_error: "Debe indicar si acepta o rechaza la oferta",
  }),
});

export type CreateOfferSchemaInput = z.infer<typeof createOfferSchema>;
export type ConfirmOfferSchemaInput = z.infer<typeof confirmOfferSchema>;
