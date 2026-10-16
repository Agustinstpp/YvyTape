import { createClient } from "@/lib/supabase/server";
import { LivestockLotWithFarm } from "@/lib/types/domain";
import { ApiResult, LotFilters } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { lotFiltersSchema } from "@/lib/validators/lots";

/**
 * Consulta los lotes pertenecientes al productor autenticado.
 */
export async function getMyLots(clientOverride?: any): Promise<ApiResult<LivestockLotWithFarm[]>> {
  try {
    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión requerida.");
    }

    const { data: lots, error } = await supabase
      .from("livestock_lots")
      .select(`
        *,
        farm:farms (
          id,
          name,
          zone,
          province
        )
      `)
      .eq("producer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResult("INTERNAL_ERROR", "Error al consultar sus lotes.", error.message);
    }

    return successResult((lots || []) as LivestockLotWithFarm[]);
  } catch (error) {
    return handleCatchError(error, "Error al consultar lotes del productor.");
  }
}

/**
 * Consulta los lotes disponibles públicamente para comercialización o formación de pools.
 * Protege datos privados (coordenadas exactas y teléfonos son omitidos).
 */
export async function getAvailableLots(
  filters?: LotFilters,
  clientOverride?: any
): Promise<ApiResult<LivestockLotWithFarm[]>> {
  try {
    if (filters) {
      const parsedFilters = lotFiltersSchema.safeParse(filters);
      if (!parsedFilters.success) {
        return errorResult(
          "VALIDATION_ERROR",
          "Filtros de consulta no válidos.",
          parsedFilters.error.format()
        );
      }
    }

    const supabase = clientOverride || (await createClient());
    let query = supabase
      .from("livestock_lots")
      .select(`
        *,
        farm:farms (
          id,
          name,
          zone,
          province
        ),
        producer:profiles (
          id,
          full_name
        )
      `)
      .eq("status", "disponible")
      .order("created_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.min_heads) {
      query = query.gte("head_count", filters.min_heads);
    }

    if (filters?.max_heads) {
      query = query.lte("head_count", filters.max_heads);
    }

    if (filters?.producer_id) {
      query = query.eq("producer_id", filters.producer_id);
    }

    const { data: lots, error } = await query;

    if (error) {
      return errorResult("INTERNAL_ERROR", "Error al consultar lotes disponibles.", error.message);
    }

    // Filtrar por zona de farm si se especificó
    let results = (lots || []) as LivestockLotWithFarm[];
    if (filters?.zone) {
      const targetZone = filters.zone.toLowerCase().trim();
      results = results.filter(
        (lot) => lot.farm?.zone?.toLowerCase().trim() === targetZone
      );
    }

    return successResult(results);
  } catch (error) {
    return handleCatchError(error, "Error al consultar lotes disponibles.");
  }
}
