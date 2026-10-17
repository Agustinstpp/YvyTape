/**
 * YVYPASS — Freight Simulator Validators (Zod)
 * Validaciones estrictas para el simulador de costos logísticos.
 */

import { z } from "zod";

export const freightInputSchema = z.object({
  kilometers: z
    .number({ invalid_type_error: "Los kilómetros deben ser un número válido." })
    .finite("Los kilómetros deben ser un valor finito.")
    .min(0, "Los kilómetros no pueden ser negativos.")
    .max(5000, "La distancia máxima para la simulación es de 5000 km."),

  stops: z
    .number({ invalid_type_error: "Las paradas deben ser un número válido." })
    .int("La cantidad de paradas debe ser un número entero.")
    .min(0, "Las paradas no pueden ser negativas.")
    .max(30, "La simulación permite un máximo de 30 paradas intermedias."),

  heads: z
    .number({ invalid_type_error: "La cantidad de cabezas debe ser un número válido." })
    .int("La cantidad de cabezas debe ser un número entero.")
    .positive("La cantidad de cabezas debe ser mayor a 0.")
    .max(2000, "La cantidad de cabezas excede el límite de simulación (2000)."),

  fixedCost: z
    .number({ invalid_type_error: "El costo fijo base debe ser un número válido." })
    .finite("El costo fijo debe ser un valor finito.")
    .min(0, "El costo fijo no puede ser negativo."),

  costPerKm: z
    .number({ invalid_type_error: "El costo por km debe ser un número válido." })
    .finite("El costo por km debe ser un valor finito.")
    .min(0, "El costo por km no puede ser negativo."),

  stopSurcharge: z
    .number({ invalid_type_error: "El recargo por parada debe ser un número válido." })
    .finite("El recargo por parada debe ser un valor finito.")
    .min(0, "El recargo por parada no puede ser negativo."),

  declaredCapacity: z
    .number({ invalid_type_error: "La capacidad declarada debe ser un número." })
    .int("La capacidad declarada debe ser un número entero.")
    .positive("La capacidad declarada debe ser mayor a 0.")
    .max(100, "La capacidad máxima por unidad simulada es de 100 cabezas.")
    .optional(),
});

export const freightComparisonSchema = z.object({
  individualKilometers: z.number().min(0).max(5000),
  individualHeads: z.number().int().positive().max(2000),
  sharedKilometers: z.number().min(0).max(5000),
  sharedStops: z.number().int().min(0).max(30),
  sharedTotalHeads: z.number().int().positive().max(2000),
  fixedCost: z.number().min(0),
  costPerKm: z.number().min(0),
  stopSurcharge: z.number().min(0),
  declaredCapacity: z.number().int().positive().optional(),
});

export type ValidatedFreightInput = z.infer<typeof freightInputSchema>;
