# LISTA DE VERIFICACIÓN DE DESPLIEGUE EN PRODUCCIÓN (VERCEL & SUPABASE)
**Proyecto:** YvyTape MVP  
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase PostgreSQL & Auth, Leaflet, Vitest.

---

## 1. Variables de Entorno Requeridas

Configurar en el panel del proyecto en **Vercel** (`Settings > Environment Variables`):

| Variable | Alcance | Descripción / Valor |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Producción / Preview | URL del proyecto Supabase (ej: `https://xyzcompany.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Producción / Preview | Clave anónima pública del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Producción / Preview *(Solo Server-Side)* | Clave de servicio de Supabase para operaciones administrativas seguras. **NUNCA expuesta con prefijo NEXT_PUBLIC_**. |

> [!CAUTION]
> Asegurarse de que `SUPABASE_SERVICE_ROLE_KEY` no tenga el prefijo `NEXT_PUBLIC_` para evitar su empaquetamiento en los bundles del cliente.

---

## 2. Aplicación de Migraciones en Base de Datos

Las siguientes migraciones deben ser aplicadas en orden secuencial en el SQL Editor o mediante Supabase CLI:

1. `supabase/migrations/20261016000001_initial_schema.sql` (Extensiones, enums, tablas base, índices y trigger base).
2. `supabase/migrations/20261016000002_rls_policies.sql` (Habilitación de RLS y políticas base).
3. `supabase/migrations/20261016000003_commercial_rpcs.sql` (Funciones transaccionales base).
4. `supabase/migrations/20261016000004_security_audit_and_messaging.sql` (Auditoría de seguridad P0, revocación de inserciones directas, blindaje de roles, mensajería persistente y compatibilidad geográfica controlada).

---

## 3. Carga de Datos de Demostración (Seed)

Para poblar las cuentas de demostración, establecimientos y ventas conjuntas iniciales:
* En entorno local o Supabase Cloud, ejecutar `supabase/seed.sql` desde el SQL Editor de Supabase o ejecutar `npm run seed:users`.
* Esto generará las cuentas de demostración con contraseña `YvyPass2026!`:
  * `productor.a@yvypass.com.ar` (Don Juan Romero - Curuzú Cuatiá)
  * `productor.b@yvypass.com.ar` (Doña Carmen Silva - Curuzú Cuatiá)
  * `productor.c@yvypass.com.ar` (Cabaña Las Lilas NEA - Curuzú Cuatiá)
  * `productor.d@yvypass.com.ar` (Don Pedro Morales - Lote disponible de 50 novillos)
  * `comprador.litoral@yvypass.com.ar` (Frigorífico del Litoral - Corrientes Capital)
  * `operador@yvypass.com.ar` (Operador Consignatario NEA)

---

## 4. Verificación de Compilación y Calidad de Código

Antes de realizar el commit y push a la rama `main`:

```bash
# 1. Dependencias limpias
npm ci

# 2. Verificación de tipos estáticos
npx tsc --noEmit

# 3. Verificación de linter (ESLint 9 + Next.js 15)
npm run lint

# 4. Ejecución de la suite completa de pruebas
npm test

# 5. Generación del bundle de producción
npm run build
```

---

## 5. Verificaciones Post-Despliegue (Smoke Tests en URL de Vercel)

1. **Ingreso y Autenticación:**
   * Iniciar sesión con `productor.a@yvypass.com.ar` -> Redirige a `/inicio`.
   * Cerrar sesión -> Redirige a `/`.
   * Iniciar sesión con `comprador.litoral@yvypass.com.ar` -> Redirige a `/ofertas`.
   * Iniciar sesión con `operador@yvypass.com.ar` -> Redirige a `/operador`.
2. **Catálogo y Mapa:**
   * Visitar `/mapa` y verificar la renderización correcta de los marcadores sin errores de SSR o Leaflet.
3. **Flujo de Venta Conjunta:**
   * Consultar la venta `Pool Novillos Curuzú Cuatiá 400` en `/ventas-conjuntas/66666666-6666-4000-8000-000000000001`.
   * Verificar que muestra 350 cabezas reunidas y el botón para simular flete con datos reales.
4. **Simulador de Fletes:**
   * Navegar a `/flete?venta=66666666-6666-4000-8000-000000000001`.
   * Verificar que se cargan los 3 productores participantes y 350 cabezas reales, con distribución proporcional de costos y comparativa de ahorro.
5. **Mensajería:**
   * Enviar una consulta interna y verificar que se guarda en Supabase, manteniéndose visible tras refrescar la página.
