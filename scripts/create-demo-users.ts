/**
 * YVYPASS — Script Administrativo de Usuarios de Demostración
 * Ideathon Corrientes 2026
 *
 * USO EXCLUSIVO EN ENTORNO DE DESARROLLO / PRUEBAS.
 * Ejecución: npm run seed:users
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("ERROR: Las variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias.");
  process.exit(1);
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface DemoUserDef {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: "productor" | "comprador" | "operador";
  zone: string;
  phone: string;
}

const DEMO_USERS: DemoUserDef[] = [
  // Productores
  {
    id: "11111111-1111-4000-8000-000000000001",
    email: "productor.a@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Don Juan Romero (DEMO)",
    role: "productor",
    zone: "Curuzú Cuatiá",
    phone: "+543774111001",
  },
  {
    id: "11111111-1111-4000-8000-000000000002",
    email: "productor.b@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Doña Carmen Silva (DEMO)",
    role: "productor",
    zone: "Curuzú Cuatiá",
    phone: "+543774111002",
  },
  {
    id: "11111111-1111-4000-8000-000000000003",
    email: "productor.c@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Cabaña Las Lilas NEA (DEMO)",
    role: "productor",
    zone: "Curuzú Cuatiá",
    phone: "+543774111003",
  },
  {
    id: "11111111-1111-4000-8000-000000000004",
    email: "productor.d@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Don Pedro Morales (DEMO)",
    role: "productor",
    zone: "Curuzú Cuatiá",
    phone: "+543774111004",
  },
  {
    id: "11111111-1111-4000-8000-000000000005",
    email: "productor.e@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Estancia Iberá (DEMO)",
    role: "productor",
    zone: "Santo Tomé",
    phone: "+543774111005",
  },
  // Compradores
  {
    id: "22222222-2222-4000-8000-000000000001",
    email: "comprador.litoral@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Frigorífico del Litoral (DEMO)",
    role: "comprador",
    zone: "Corrientes Capital",
    phone: "+543794222001",
  },
  {
    id: "22222222-2222-4000-8000-000000000002",
    email: "comprador.sa@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Carnes Correntinas SA (DEMO)",
    role: "comprador",
    zone: "Goya",
    phone: "+543794222002",
  },
  // Operador
  {
    id: "33333333-3333-4000-8000-000000000001",
    email: "operador@yvypass.com.ar",
    password: "YvyPass2026!",
    fullName: "Operador Consignatario NEA (DEMO)",
    role: "operador",
    zone: "Corrientes",
    phone: "+543794333001",
  },
];

async function seedDemoUsers() {
  console.log("🌱 Creando usuarios de demostración para YvyPass...");

  for (const userDef of DEMO_USERS) {
    try {
      // 1. Crear o verificar en auth.users
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userDef.email,
        password: userDef.password,
        email_confirm: true,
        user_metadata: {
          full_name: userDef.fullName,
          role: userDef.role,
          zone: userDef.zone,
          phone: userDef.phone,
        },
      });

      let userId = data?.user?.id;

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          console.log(`ℹ️ Usuario ya existe: ${userDef.email}. Sincronizando perfil...`);
          // Buscar ID de usuario existente
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users.find((u) => u.email === userDef.email);
          if (existing) {
            userId = existing.id;
          }
        } else {
          console.error(`❌ Error al crear usuario ${userDef.email}:`, error.message);
          continue;
        }
      }

      if (userId) {
        // 2. Sincronizar en profiles con rol elevado
        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: userId,
          full_name: userDef.fullName,
          role: userDef.role,
          zone: userDef.zone,
          phone: userDef.phone,
        });

        if (profileError) {
          console.error(`⚠️ Error al actualizar perfil para ${userDef.email}:`, profileError.message);
        } else {
          console.log(`✅ [${userDef.role.toUpperCase()}] ${userDef.email} listo.`);
        }
      }
    } catch (e: any) {
      console.error(`Error procesando ${userDef.email}:`, e?.message);
    }
  }

  console.log("✨ Proceso de seed de usuarios finalizado.");
}

seedDemoUsers().catch(console.error);
