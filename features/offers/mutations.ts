import { createClient } from "@/lib/supabase/server";
import { Offer, CreateOfferInput } from "@/lib/types/domain";
import { ApiResult } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { createOfferSchema, confirmOfferSchema } from "@/lib/validators/offers";

/**
 * Registra una oferta indicativa de un comprador para un pool con objetivo alcanzado.
 */
export async function createOffer(
  poolId: string,
  input: CreateOfferInput,
  clientOverride?: any
): Promise<ApiResult<{ id: string; message: string }>> {
  try {
    const parsed = createOfferSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Precio por kg no válido.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());

    const { data, error } = await supabase.rpc("rpc_create_offer", {
      p_pool_id: poolId,
      p_price_per_kg: parsed.data.price_per_kg,
    });

    if (error) {
      return errorResult(
        "BUSINESS_RULE_VIOLATION",
        error.message || "No se pudo registrar la oferta comercial."
      );
    }

    const res = data as any;
    return successResult({
      id: res.offer_id,
      message: res.message,
    });
  } catch (error) {
    return handleCatchError(error, "Error al presentar oferta comercial.");
  }
}

/**
 * Registra la confirmación o rechazo individual de un productor sobre una oferta comercial activa.
 */
export async function confirmOffer(
  offerId: string,
  accepted: boolean,
  clientOverride?: any
): Promise<
  ApiResult<{
    success: boolean;
    all_confirmed: boolean;
    total_producers: number;
    confirmed_producers: number;
    message: string;
  }>
> {
  try {
    const parsed = confirmOfferSchema.safeParse({ offer_id: offerId, accepted });
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Parámetros de confirmación no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());

    const { data, error } = await supabase.rpc("rpc_confirm_offer", {
      p_offer_id: offerId,
      p_accepted: accepted,
    });

    if (error) {
      return errorResult(
        "BUSINESS_RULE_VIOLATION",
        error.message || "Error al registrar la confirmación de la oferta."
      );
    }

    const res = data as any;
    return successResult({
      success: res.success,
      all_confirmed: res.all_confirmed,
      total_producers: res.total_producers,
      confirmed_producers: res.confirmed_producers,
      message: res.message,
    });
  } catch (error) {
    return handleCatchError(error, "Error al confirmar oferta.");
  }
}

/**
 * Ejecuta el cierre comercial demostrativo de un pool por parte de un operador autorizado.
 */
export async function closePool(
  poolId: string,
  clientOverride?: any
): Promise<ApiResult<{ success: boolean; message: string }>> {
  try {
    const supabase = clientOverride || (await createClient());

    const { data, error } = await supabase.rpc("rpc_close_pool", {
      p_pool_id: poolId,
    });

    if (error) {
      return errorResult(
        "BUSINESS_RULE_VIOLATION",
        error.message || "Error al procesar el cierre del pool."
      );
    }

    const res = data as any;
    return successResult({
      success: res.success,
      message: res.message,
    });
  } catch (error) {
    return handleCatchError(error, "Error al cerrar el pool de venta.");
  }
}
