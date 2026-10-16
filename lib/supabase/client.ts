import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types/database";

/**
 * Cliente Supabase para el navegador / Client Components.
 * Utiliza estrictamente la URL pública y la anon/publishable key.
 * NUNCA contiene la clave de servicio (service_role).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
