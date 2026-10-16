import { createClient } from "@/lib/supabase/server";
import { Offer } from "@/lib/types/domain";
import { ApiResult } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";

/**
 * Consulta las ofertas asociadas a un pool de venta con sus confirmaciones correspondientes.
 */
export async function getPoolOffers(
  poolId: string,
  clientOverride?: any
): Promise<ApiResult<Offer[]>> {
  try {
    const supabase = clientOverride || (await createClient());

    const { data: offers, error } = await supabase
      .from("offers")
      .select(`
        *,
        buyer:profiles (
          id,
          full_name
        ),
        confirmations:offer_confirmations (
          *,
          producer:profiles (
            id,
            full_name
          )
        )
      `)
      .eq("pool_id", poolId)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResult("INTERNAL_ERROR", "Error al consultar las ofertas del pool.", error.message);
    }

    return successResult((offers || []) as Offer[]);
  } catch (error) {
    return handleCatchError(error, "Error al consultar ofertas comerciales.");
  }
}
