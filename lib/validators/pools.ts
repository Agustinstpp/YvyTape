import { z } from "zod";
import { LIVESTOCK_CATEGORIES } from "./lots";

export const POOL_STATUSES = [
  "abierto",
  "objetivo_alcanzado",
  "en_negociacion",
  "cerrado",
  "cancelado",
] as const;

export const createPoolSchema = z.object({
  title: z
    .string()
    .min(3, "El título del pool debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  zone: z
    .string()
    .min(2, "La zona debe tener al menos 2 caracteres")
    .max(50, "La zona no puede exceder 50 caracteres"),
  category: z.enum(LIVESTOCK_CATEGORIES, {
    errorMap: () => ({ message: "Categoría ganadera no válida" }),
  }),
  target_heads: z
    .number({ invalid_type_error: "El objetivo de cabezas debe ser un número" })
    .int("El objetivo de cabezas debe ser un entero")
    .positive("El objetivo de cabezas debe ser mayor a 0")
    .max(10000, "El objetivo de cabezas excede el límite permitido"),
});

export const joinPoolSchema = z.object({
  pool_id: z.string().uuid("ID de pool no válido"),
  lot_id: z.string().uuid("ID de lote no válido"),
});

export const leavePoolSchema = z.object({
  pool_id: z.string().uuid("ID de pool no válido"),
  lot_id: z.string().uuid("ID de lote no válido"),
});

export const poolFiltersSchema = z.object({
  category: z.enum(LIVESTOCK_CATEGORIES).optional(),
  zone: z.string().optional(),
  status: z.enum(POOL_STATUSES).optional(),
});

export type CreatePoolSchemaInput = z.infer<typeof createPoolSchema>;
export type JoinPoolSchemaInput = z.infer<typeof joinPoolSchema>;
export type LeavePoolSchemaInput = z.infer<typeof leavePoolSchema>;
export type PoolFiltersSchemaInput = z.infer<typeof poolFiltersSchema>;
