import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/queries";
import type { Profile, UserRole } from "@/lib/types/domain";

/** Perfil del usuario con sesión, o null si no inició sesión. */
export async function getSessionProfile(): Promise<Profile | null> {
  const { data } = await getCurrentProfile();
  return data ?? null;
}

/** Exige sesión (y opcionalmente un rol). Si no, manda a ingresar o a su inicio. */
export async function requireProfile(roles?: UserRole[]): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/ingresar");
  if (roles && !roles.includes(profile.role)) redirect(homeFor(profile.role));
  return profile;
}

export function homeFor(role: UserRole): string {
  if (role === "comprador") return "/ofertas";
  if (role === "operador") return "/operador";
  return "/inicio";
}
