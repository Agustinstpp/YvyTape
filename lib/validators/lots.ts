import { z } from "zod";

export const LIVESTOCK_CATEGORIES = [
  "ternero",
  "ternera",
  "novillo",
  "vaquillona",
  "vaca",
  "toro",
] as const;

export const VERIFICATION_STATUSES = [
  "declarado",
  "pendiente",
  "revisado",
] as const;

export const LOT_STATUSES = ["disponible", "reservado", "vendido"] as const;

export const createLotSchema = z.object({
  farm_id: z.string().uuid("Debe seleccionar un establecimiento válido"),
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  category: z.enum(LIVESTOCK_CATEGORIES, {
    errorMap: () => ({ message: "Categoría ganadera no válida" }),
  }),
  breed: z
    .string()
    .min(2, "La raza debe tener al menos 2 caracteres")
    .max(50, "La raza no puede exceder 50 caracteres"),
  head_count: z
    .number({ invalid_type_error: "La cantidad de cabezas debe ser un número" })
    .int("La cantidad de cabezas debe ser un número entero")
    .positive("La cantidad de cabezas debe ser mayor a 0")
    .max(5000, "La cantidad de cabezas supera el límite razonable"),
  average_weight_kg: z
    .number({ invalid_type_error: "El peso promedio debe ser un número" })
    .positive("El peso promedio debe ser mayor a 0 kg")
    .max(1500, "El peso promedio excede el rango biológico admitido"),
  electronic_tag_reference: z
    .string()
    .max(100, "La referencia de caravana no puede superar 100 caracteres")
    .nullable()
    .optional(),
});

export const updateLotSchema = createLotSchema.partial();

export const lotFiltersSchema = z.object({
  category: z.enum(LIVESTOCK_CATEGORIES).optional(),
  zone: z.string().optional(),
  status: z.enum(LOT_STATUSES).optional(),
  min_heads: z.number().int().positive().optional(),
  max_heads: z.number().int().positive().optional(),
  producer_id: z.string().uuid().optional(),
});

export type CreateLotSchemaInput = z.infer<typeof createLotSchema>;
export type UpdateLotSchemaInput = z.infer<typeof updateLotSchema>;
export type LotFiltersSchemaInput = z.infer<typeof lotFiltersSchema>;
