import { createClient } from "@/lib/supabase/server";
import { Profile, Farm, CreateFarmInput } from "@/lib/types/domain";
import { ApiResult } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { z } from "zod";

const createFarmSchema = z.object({
  name: z.string().min(2, "El nombre del establecimiento debe tener al menos 2 caracteres"),
  zone: z.string().min(2, "La zona debe tener al menos 2 caracteres"),
  province: z.string().optional().default("Corrientes"),
  approximate_lat: z.number().nullable().optional(),
  approximate_lng: z.number().nullable().optional(),
});

/**
 * Obtiene el perfil del usuario autenticado actual.
 */
export async function getCurrentProfile(clientOverride?: any): Promise<ApiResult<Profile>> {
  try {
    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión no válida o no iniciada.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return errorResult("NOT_FOUND", "Perfil de usuario no encontrado.");
    }

    return successResult(profile as Profile);
  } catch (error) {
    return handleCatchError(error, "Error al obtener el perfil de usuario.");
  }
}

/**
 * Obtiene los establecimientos del productor autenticado.
 */
export async function getMyFarms(clientOverride?: any): Promise<ApiResult<Farm[]>> {
  try {
    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión requerida.");
    }

    const { data: farms, error: farmsError } = await supabase
      .from("farms")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (farmsError) {
      return errorResult("INTERNAL_ERROR", "Error al consultar establecimientos.", farmsError.message);
    }

    return successResult(farms as Farm[]);
  } catch (error) {
    return handleCatchError(error, "Error al consultar establecimientos.");
  }
}

/**
 * Crea un nuevo establecimiento para el productor autenticado.
 */
export async function createFarm(
  input: CreateFarmInput,
  clientOverride?: any
): Promise<ApiResult<Farm>> {
  try {
    const parsed = createFarmSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Datos del establecimiento no válidos.",
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
      return errorResult("FORBIDDEN", "Solo los productores pueden registrar establecimientos.");
    }

    const { data: farm, error: insertError } = await supabase
      .from("farms")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        zone: parsed.data.zone,
        province: parsed.data.province,
        approximate_lat: parsed.data.approximate_lat ?? null,
        approximate_lng: parsed.data.approximate_lng ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return errorResult("INTERNAL_ERROR", "No se pudo registrar el establecimiento.", insertError.message);
    }

    return successResult(farm as Farm);
  } catch (error) {
    return handleCatchError(error, "Error al crear establecimiento.");
  }
}
