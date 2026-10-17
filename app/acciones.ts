"use server";

/**
 * Acciones de formulario del front. Solo llaman a los servicios que ya existen
 * en el backend (features/*) y a Supabase Auth; no agregan lógica de negocio.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createFarm, getMyFarms } from "@/features/auth/queries";
import { createLot } from "@/features/lots/mutations";
import { createPool, joinPool, leavePool } from "@/features/pools/mutations";
import { closePool, confirmOffer, createOffer } from "@/features/offers/mutations";
import { getSessionProfile, homeFor } from "@/lib/session";
import { mensajes } from "@/lib/front/mensajes";
import type { FormState } from "@/components/form-parts";
import type { LivestockCategory } from "@/lib/types/domain";
import { CATEGORIES, categoryLabel, parseNumero } from "@/lib/ui/format";
import { canonZona } from "@/lib/front/zonas";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => parseNumero(str(fd, k));

// ------------------------------------------------------------------ sesión
/**
 * Demo sin verificación de correo: si hay SUPABASE_SERVICE_ROLE_KEY en el servidor, las cuentas se crean
 * ya confirmadas y se destraban las que quedaron esperando el mail. Sin esa clave se usa el flujo normal.
 * TODO(producción): volver a pedir confirmación de correo.
 */
function admin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function confirmarCorreo(email: string): Promise<boolean> {
  const a = admin();
  if (!a) return false;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users.length) return false;
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return !(await a.auth.admin.updateUserById(u.id, { email_confirm: true })).error;
    if (data.users.length < 200) return false;
  }
  return false;
}

export async function ingresar(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: "Completá tu correo y tu contraseña." };
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && /confirm/i.test(`${error.code ?? ""} ${error.message}`) && (await confirmarCorreo(email))) {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  }
  if (error) return { error: "El correo o la contraseña no coinciden. Revisalos y probá de nuevo." };
  const perfil = await getSessionProfile();
  redirect(perfil ? homeFor(perfil.role) : "/inicio");
}

export async function registrarse(_: FormState, fd: FormData): Promise<FormState> {
  const full_name = str(fd, "full_name");
  const zone = canonZona(str(fd, "zone"));
  const email = str(fd, "email");
  const password = str(fd, "password");
  const role = str(fd, "role") === "comprador" ? "comprador" : "productor";
  const fieldErrors: Record<string, string> = {};
  if (full_name.length < 3) fieldErrors.full_name = "Escribí tu nombre o el de tu establecimiento.";
  if (zone.length < 2) fieldErrors.zone = "Escribí tu localidad.";
  if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Revisá el correo, por ejemplo: nombre@correo.com.";
  if (password.length < 8) fieldErrors.password = "La contraseña tiene que tener 8 letras o números como mínimo.";
  if (Object.keys(fieldErrors).length) return { error: "Revisá los datos marcados.", fieldErrors };

  // TODO(backend): el rol se toma de la metadata del signUp; cualquiera puede llamar a signUp con role "operador".
  //   El trigger handle_new_user debería aceptar solo productor/comprador.
  const supabase = await createClient();
  // No se pide teléfono: toda la comunicación queda dentro de YvyTape.
  const a = admin();
  if (a) {
    // Cuenta creada ya confirmada: entra directo, sin mail.
    const { error } = await a.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, zone, role },
    });
    if (error) return { error: "No pudimos crear la cuenta. Puede que ese correo ya esté registrado." };
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) return { error: "La cuenta se creó, pero no pudimos ingresar. Probá desde Ingresar." };
  } else {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, zone, role } },
    });
    if (error) return { error: "No pudimos crear la cuenta. Puede que ese correo ya esté registrado." };
    if (!data.session) return { ok: "Te mandamos un correo para confirmar la cuenta. Abrilo y después entrá." };
  }
  redirect(role === "comprador" ? "/ofertas" : "/inicio");
}

export async function salir() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ------------------------------------------------------------------ lotes
export async function registrarLote(_: FormState, fd: FormData): Promise<FormState> {
  const perfil = await getSessionProfile();
  if (!perfil) redirect("/ingresar");

  let farm_id = str(fd, "farm_id");
  const fieldErrors: Record<string, string> = {};
  const category = str(fd, "category") as LivestockCategory;
  const breed = str(fd, "breed");
  const head_count = num(fd, "head_count");
  const average_weight_kg = num(fd, "average_weight_kg");

  if (!farm_id || farm_id === "nuevo") {
    if (str(fd, "farm_name").length < 2) fieldErrors.farm_name = "Escribí el nombre del establecimiento.";
    if (str(fd, "farm_zone").length < 2) fieldErrors.farm_zone = "Escribí la localidad del establecimiento.";
  }
  if (!CATEGORIES.includes(category)) fieldErrors.category = "Elegí la categoría.";
  if (breed.length < 2) fieldErrors.breed = "Escribí la raza, por ejemplo: Braford.";
  if (!Number.isInteger(head_count) || head_count <= 0)
    fieldErrors.head_count = "Escribí la cantidad con números, por ejemplo: 13.";
  if (!(average_weight_kg > 0)) fieldErrors.average_weight_kg = "Escribí el peso promedio en kg, por ejemplo: 180.";
  if (Object.keys(fieldErrors).length) return { error: "Falta corregir algunos datos para seguir.", fieldErrors };

  if (!farm_id || farm_id === "nuevo") {
    const farm = await createFarm({ name: str(fd, "farm_name"), zone: canonZona(str(fd, "farm_zone")) });
    if (farm.error || !farm.data) return { error: farm.error?.message ?? "No pudimos guardar el establecimiento." };
    farm_id = farm.data.id;
  }

  const title = str(fd, "title") || `${head_count} ${categoryLabel(category, head_count !== 1).toLowerCase()} ${breed}`;
  const res = await createLot({
    farm_id,
    title,
    category,
    breed,
    head_count,
    average_weight_kg,
    electronic_tag_reference: str(fd, "electronic_tag_reference") || null,
  });
  if (res.error || !res.data) return { error: res.error?.message ?? "No pudimos guardar el lote. Tus datos no se perdieron: probá de nuevo." };
  revalidatePath("/mis-lotes");
  revalidatePath("/inicio");
  redirect(`/mis-lotes/guardado?lote=${res.data.id}`);
}

export async function tieneEstablecimientos(): Promise<boolean> {
  const { data } = await getMyFarms();
  return (data ?? []).length > 0;
}

// ------------------------------------------------------------------ ventas conjuntas
export async function crearVenta(_: FormState, fd: FormData): Promise<FormState> {
  const category = str(fd, "category") as LivestockCategory;
  const target_heads = num(fd, "target_heads");
  const zone = canonZona(str(fd, "zone"));
  const title = str(fd, "title");
  if (!CATEGORIES.includes(category)) return { error: "Elegí la categoría." };
  if (!Number.isInteger(target_heads) || target_heads <= 0) return { error: "Escribí el objetivo de cabezas con números." };
  if (zone.length < 2) return { error: "Escribí la zona." };
  const res = await createPool({ title: title || `Venta de ${categoryLabel(category, true).toLowerCase()} en ${zone}`, zone, category, target_heads });
  if (res.error || !res.data) return { error: res.error?.message ?? "No pudimos crear la venta conjunta." };
  revalidatePath("/ventas-conjuntas");
  redirect(`/ventas-conjuntas/${res.data.id}`);
}

export async function sumarLote(_: FormState, fd: FormData): Promise<FormState> {
  const poolId = str(fd, "pool_id");
  const lotId = str(fd, "lot_id");
  if (!lotId) return { error: "Elegí cuál de tus lotes querés sumar." };
  const res = await joinPool(poolId, lotId);
  if (res.error) return { error: res.error.message };
  revalidatePath(`/ventas-conjuntas/${poolId}`);
  revalidatePath("/mis-lotes");
  return { ok: "Sumaste tu lote a la venta conjunta." };
}

export async function salirDeVenta(_: FormState, fd: FormData): Promise<FormState> {
  const poolId = str(fd, "pool_id");
  const res = await leavePool(poolId, str(fd, "lot_id"));
  if (res.error) return { error: res.error.message };
  revalidatePath(`/ventas-conjuntas/${poolId}`);
  revalidatePath("/mis-lotes");
  return { ok: "Sacaste tu lote. Vuelve a estar disponible en Mis lotes." };
}

// ------------------------------------------------------------------ ofertas
export async function ofertar(_: FormState, fd: FormData): Promise<FormState> {
  const poolId = str(fd, "pool_id");
  const price = num(fd, "price_per_kg");
  if (!(price > 0)) return { error: "Escribí el precio por kg con números, por ejemplo: 2850." };
  const res = await createOffer(poolId, { price_per_kg: price });
  if (res.error) return { error: res.error.message };
  revalidatePath(`/ventas-conjuntas/${poolId}`);
  redirect(`/oferta-enviada?venta=${poolId}`);
}

export async function responderOferta(_: FormState, fd: FormData): Promise<FormState> {
  const poolId = str(fd, "pool_id");
  const accepted = str(fd, "respuesta") === "si";
  const res = await confirmOffer(str(fd, "offer_id"), accepted);
  if (res.error) return { error: res.error.message };
  revalidatePath(`/ventas-conjuntas/${poolId}`);
  revalidatePath("/inicio");
  redirect(`/ventas-conjuntas/${poolId}?respuesta=${accepted ? "si" : "no"}`);
}

export async function cerrarVenta(_: FormState, fd: FormData): Promise<FormState> {
  const poolId = str(fd, "pool_id");
  const res = await closePool(poolId);
  if (res.error) return { error: res.error.message };
  revalidatePath("/operador");
  revalidatePath(`/ventas-conjuntas/${poolId}`);
  // TODO(backend): al cerrar, avisar automáticamente a comprador y productores (hoy el martillero lo hace a mano).
  return { ok: "Venta cerrada. Avisale a las partes por Mensajes." };
}

// ------------------------------------------------------------------ mensajes
export async function iniciarConsulta(_: FormState, fd: FormData): Promise<FormState> {
  const perfil = await getSessionProfile();
  if (!perfil) redirect("/ingresar");
  const res = await mensajes.iniciar(perfil, {
    poolId: str(fd, "pool_id") || null,
    lotId: str(fd, "lot_id") || null,
    asunto: str(fd, "asunto") || "Consulta",
    contexto: str(fd, "contexto") || "Consulta al equipo YvyTape",
    texto: str(fd, "texto"),
  });
  if (!res.data) return { error: res.error };
  revalidatePath("/mensajes");
  redirect(`/mensajes/${res.data.id}`);
}

/**
 * Invita por mensajería interna a los productores de una o más localidades cercanas a sumarse a la venta.
 * TODO(backend): la invitación debería llegar al productor dueño de cada lote (hoy queda en la conversación
 *   de la venta, que coordina el martillero). Y joinPool exige la MISMA zona: para sumar lotes de localidades
 *   cercanas hace falta que el backend acepte un radio en km.
 */
export async function invitarACaravana(_: FormState, fd: FormData): Promise<FormState> {
  const perfil = await getSessionProfile();
  if (!perfil) redirect("/ingresar");
  const poolId = str(fd, "pool_id");
  const titulo = str(fd, "titulo");
  const zonas = fd.getAll("zona").map(String).filter(Boolean);
  const lotes = fd.getAll("lote").map(String).filter(Boolean);
  if (!zonas.length) return { error: "Elegí a quién invitar." };
  const res = await mensajes.iniciar(perfil, {
    poolId,
    lotId: lotes[0] ?? null,
    asunto: `Invitación a «${titulo}»`,
    contexto: `Venta conjunta · ${titulo}`,
    texto: `Hola: estamos armando la venta conjunta «${titulo}» y nos faltan animales. Hay lotes disponibles en ${zonas.join(", ")}. ¿Quieren sumarse? Respondan por acá y el martillero lo coordina.`,
  });
  if (!res.data) return { error: res.error };
  revalidatePath("/mensajes");
  return { ok: `Enviamos la invitación a ${zonas.join(", ")} por Mensajes.` };
}

export async function enviarMensaje(_: FormState, fd: FormData): Promise<FormState> {
  const perfil = await getSessionProfile();
  if (!perfil) redirect("/ingresar");
  const id = str(fd, "conversacion_id");
  const res = await mensajes.enviar(perfil, id, str(fd, "texto"));
  if (res.error) return { error: res.error };
  revalidatePath(`/mensajes/${id}`);
  return { ok: "" };
}
