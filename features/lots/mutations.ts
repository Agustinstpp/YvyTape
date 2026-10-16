import { createClient } from "@/lib/supabase/server";
import { LivestockLot, CreateLotInput, UpdateLotInput } from "@/lib/types/domain";
import { ApiResult } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { createLotSchema, updateLotSchema } from "@/lib/validators/lots";

/**
 * Registra un nuevo lote ganadero para el productor autenticado.
 */
export async function createLot(
  input: CreateLotInput,
  clientOverride?: any
): Promise<ApiResult<LivestockLot>> {
  try {
    const parsed = createLotSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Datos del lote no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión requerida.");
    }

    // Verificar rol de productor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "productor") {
      return errorResult("FORBIDDEN", "Solo los productores pueden registrar lotes ganaderos.");
    }

    // Verificar que el establecimiento pertenece al productor
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", parsed.data.farm_id)
      .eq("owner_id", user.id)
      .single();

    if (farmError || !farm) {
      return errorResult(
        "FORBIDDEN",
        "El establecimiento indicado no existe o no pertenece a su cuenta."
      );
    }

    const { data: lot, error: insertError } = await supabase
      .from("livestock_lots")
      .insert({
        producer_id: user.id,
        farm_id: parsed.data.farm_id,
        title: parsed.data.title,
        category: parsed.data.category,
        breed: parsed.data.breed,
        head_count: parsed.data.head_count,
        average_weight_kg: parsed.data.average_weight_kg,
        electronic_tag_reference: parsed.data.electronic_tag_reference ?? null,
        verification_status: "declarado",
        status: "disponible",
      })
      .select()
      .single();

    if (insertError) {
      return errorResult("INTERNAL_ERROR", "Error al registrar el lote ganadero.", insertError.message);
    }

    return successResult(lot as LivestockLot);
  } catch (error) {
    return handleCatchError(error, "Error al registrar el lote.");
  }
}

/**
 * Actualiza los datos de un lote ganadero propio.
 * Solo permitido si el lote se encuentra disponible (no reservado en pools ni vendido).
 */
export async function updateLot(
  id: string,
  input: UpdateLotInput,
  clientOverride?: any
): Promise<ApiResult<LivestockLot>> {
  try {
    const parsed = updateLotSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Datos a actualizar no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión requerida.");
    }

    // Verificar existencia, propiedad y estado del lote
    const { data: existingLot, error: fetchError } = await supabase
      .from("livestock_lots")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingLot) {
      return errorResult("NOT_FOUND", "El lote solicitado no existe.");
    }

    if (existingLot.producer_id !== user.id) {
      return errorResult("FORBIDDEN", "No tiene autorización para modificar este lote.");
    }

    if (existingLot.status !== "disponible") {
      return errorResult(
        "CONFLICT",
        `No es posible modificar un lote en estado '${existingLot.status}'. Los lotes adheridos a un pool o vendidos están bloqueados.`
      );
    }

    // Si actualiza farm_id, verificar pertenencia
    if (parsed.data.farm_id) {
      const { data: farm } = await supabase
        .from("farms")
        .select("id")
        .eq("id", parsed.data.farm_id)
        .eq("owner_id", user.id)
        .single();

      if (!farm) {
        return errorResult("FORBIDDEN", "El establecimiento indicado no le pertenece.");
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title;
    if (parsed.data.category !== undefined) updatePayload.category = parsed.data.category;
    if (parsed.data.breed !== undefined) updatePayload.breed = parsed.data.breed;
    if (parsed.data.head_count !== undefined) updatePayload.head_count = parsed.data.head_count;
    if (parsed.data.average_weight_kg !== undefined) updatePayload.average_weight_kg = parsed.data.average_weight_kg;
    if (parsed.data.electronic_tag_reference !== undefined)
      updatePayload.electronic_tag_reference = parsed.data.electronic_tag_reference;
    if (parsed.data.farm_id !== undefined) updatePayload.farm_id = parsed.data.farm_id;

    const { data: updatedLot, error: updateError } = await supabase
      .from("livestock_lots")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return errorResult("INTERNAL_ERROR", "Error al actualizar el lote.", updateError.message);
    }

    return successResult(updatedLot as LivestockLot);
  } catch (error) {
    return handleCatchError(error, "Error al actualizar el lote ganadero.");
  }
}
