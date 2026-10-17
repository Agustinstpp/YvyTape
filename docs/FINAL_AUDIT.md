# AUDITORÍA FINAL DE SEGURIDAD, INTEGRACIÓN Y ARQUITECTURA — YVYTAPE MVP
**Fecha de Auditoría:** 17 de Octubre de 2026  
**Equipo Auditor:** Arquitectura de Software, Backend/RLS, Frontend React/Next.js y QA  
**Repositorio:** [https://github.com/Agustinstpp/YvyTape](https://github.com/Agustinstpp/YvyTape)  
**Rama:** `main`

---

## 1. Resumen Ejecutivo
Se realizó una auditoría integral y cierre técnico del MVP de **YvyTape**, una plataforma ganadera de comercialización colaborativa orientada a pequeños y medianos productores del NEA argentino. Se corrigieron vulnerabilidades críticas de autorización (P0), se implementó la persistencia real de mensajería sobre PostgreSQL y RLS (P1), se habilitó la compatibilidad geográfica controlada entre localidades ganaderas vecinas (P1), y se integró de forma completa el simulador de flete logístico con los datos reales de ventas conjuntas.

La suite automatizada cuenta con **102 pruebas unitarias y de integración pasando al 100%**, verificación estricta de TypeScript (`tsc --noEmit`), linting conforme a ESLint 9 / Next.js 15 y build productivo de Next.js (`npm run build`) validado con 20 rutas generadas.

---

## 2. Hallazgos y Correcciones por Módulo

### 2.1 Fase 1: Seguridad, Roles y Row Level Security (RLS) — Prioridad P0
* **Vulnerabilidad Crítica en Asignación de Roles:**
  * *Condición Previa:* El trigger `handle_new_user()` extraía el rol directamente de `NEW.raw_user_meta_data->>'role'`, permitiendo que una solicitud manipulada de registro (`signUp`) asignara el rol `operador`.
  * *Solución Aplicada:* Se implementó la Migración `20261016000004_security_audit_and_messaging.sql`, redefiniendo `handle_new_user()` con validación estricta y degradación forzada: únicamente los roles `productor` y `comprador` son admitidos en el registro público. Cualquier solicitud que especifique `operador` o valor no autorizado es degradada de inmediato a `productor`. La asignación del rol `operador` queda restringida a intervenciones administrativas a través de `SUPABASE_SERVICE_ROLE_KEY`.
* **Elusión de Reglas Comerciales por Escritura Directa (RLS):**
  * *Condición Previa:* Existían políticas de inserción directa abierta en `pool_members` (`pool_members_insert_policy`), `offers` (`offers_insert_policy`) y `offer_confirmations` (`confirmations_insert_policy`), lo cual permitía eludir las verificaciones atómicas del negocio (capacidad máxima, compatibilidad de categoría, reserva previa, etc.).
  * *Solución Aplicada:* Se revocaron las políticas de inserción directa de dichas tablas. Toda mutación sensible debe realizarse exclusivamente a través de las funciones transaccionales con `SECURITY DEFINER`: `rpc_join_pool`, `rpc_leave_pool`, `rpc_create_offer`, `rpc_confirm_offer` y `rpc_close_pool`.
* **Inyección de Search Path y Permisos de Ejecución:**
  * *Condición Previa:* Las funciones `SECURITY DEFINER` previas no declaraban `SET search_path = public, pg_temp;`, exponiéndolas a ataques de search path hijacking.
  * *Solución Aplicada:* Todas las funciones fueron reforzadas con `SET search_path = public, pg_temp;` y se revocaron permisos de ejecución a `PUBLIC`, concediéndolos únicamente al rol `authenticated`.
* **Consistencia Transaccional Concurrente:**
  * Se aseguró el bloqueo pesimista `FOR UPDATE` en `sales_pools`, `livestock_lots` y `offers` para garantizar que:
    1. Un lote no pueda adherirse a dos ventas activas en simultáneo.
    2. Dos usuarios concurrentes no puedan superar el objetivo de cabezas (`target_heads`).
    3. Una oferta rechazada no pueda ser cerrada como aceptada.
    4. Una venta cerrada sea inmutable.
    5. Cada confirmación sea intransferible y única por productor participante.

---

### 2.2 Fase 2: Mensajería Real con Supabase — Prioridad P1
* *Condición Previa:* `lib/front/mensajes.ts` dependía de `demoAdapter` con almacenamiento efímero en memoria volátil de Node.js, perdiéndose el historial al reiniciar y sin persistencia en Supabase.
* *Solución Aplicada:*
  1. **Modelo de Datos en PostgreSQL:** Se crearon las tablas `conversations`, `conversation_participants` y `messages` con claves foráneas, restricciones de longitud e índices optimizados para consulta temporal.
  2. **Row Level Security (RLS) Estricto:** Políticas de aislamiento donde los usuarios solo pueden consultar conversaciones y mensajes donde están registrados como participantes, con excepción del operador comercial que audita las consultas del sistema.
  3. **Adaptador Persistente:** Se implementó `supabaseAdapter` respetando la interfaz `MensajesAdapter`. Se mantuvo la propiedad `esDemo: false`, ocultando las advertencias temporales en el front.
  4. **Filtro Anti-Desintermediación:** Se valida en servidor y en frontend la prohibición estricta de compartir datos de contacto externos (teléfonos, prefijos whatsapp, correos electrónicos y dominios web) conforme a las reglas comerciales de la consignataria.
  5. **Derivación Automática de Participantes:** Cuando una consulta se inicia sobre una venta conjunta, el sistema vincula automáticamente al operador y a los productores con lotes en la venta.

---

### 2.3 Fase 3: Compatibilidad Geográfica entre Zonas Cercanas — Prioridad P1
* *Condición Previa:* `rpc_join_pool` y el motor de validación exigían igualdad textual estricta entre la localidad del campo y la localidad del pool (`LOWER(farm.zone) = LOWER(pool.zone)`), imposibilitando la propuesta de valor de agrupar productores vecinos de localidades contiguas.
* *Solución Aplicada:*
  1. **Función SQL `are_zones_compatible(p_zone_a, p_zone_b)`:** Evalúa compatibilidad por identidad de zona o por inclusión en el catálogo de hubs ganaderos compatibles del NEA (Curuzú Cuatiá <-> Mercedes, Curuzú Cuatiá <-> Monte Caseros, Goya <-> Bella Vista, Santo Tomé <-> Virasoro) en radio operativo de hasta 80 km.
  2. **Módulo TypeScript Homogéneo:** Se incorporó `areZonesCompatible` y `calculateZoneDistanceKm` en `features/geography/zones.ts` y se actualizó `checkLotCompatibility` en `features/commercial/compatibility.ts`.
  3. **Radio de Convocatoria en UI:** Se ajustó `RADIO_KM = 75` en `lib/front/cercanos.ts` y en `app/ventas-conjuntas/[id]/completar/page.tsx`, permitiendo invitar a lotes vecinos y garantizando que el backend acepte su adhesión transaccional sin rechazos espurios.

---

### 2.4 Fase 4: Integración Real del Simulador de Fletes — Prioridad P1
* *Condición Previa:* `components/flete/FreightCalculator.tsx` utilizaba datos fijos simulados (`DEMO_PRODUCER_CONTRIBUTIONS`) y ejecutaba `setValidationError` dentro del hook `useMemo`, generando advertencias de actualización de estado durante el render en React 19.
* *Solución Aplicada:*
  1. **Carga Dinámica de la Venta Conjunta:** Cuando se accede a `/flete?venta=[id]`, `app/flete/page.tsx` consulta el detalle real del pool y sus miembros en Supabase.
  2. **Cálculo de Contribuciones Reales:** Agrupa las cabezas aportadas por productor, calcula el peso total estimado y computa la cantidad de paradas intermedias reales.
  3. **Reparto Equitativo y Transparente:** La calculadora distribuye el costo total en forma estrictamente proporcional a las cabezas aportadas, calculando un costo idéntico por cabeza y demostrando el ahorro significativo frente a un flete individual.
  4. **Corrección de Estado React 19:** Se desacopló la validación como valor memoizado puro (`useMemo`), eliminando cualquier llamada a `setState` durante el ciclo de renderizado.

---

## 3. Matriz de Auditoría y Verificación de Funcionalidades

| Funcionalidad | Estado Anterior | Cambio Realizado | Estado Final | Prueba Ejecutada | Resultado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Asignación de Roles** | Vulnerable en `handle_new_user()` (podía solicitarse 'operador'). | Lista blanca estricta ('productor', 'comprador') y degradación segura. | Seguro contra escalada de privilegios. | `tests/auth-security.test.ts` | **Aprobado** |
| **RLS en Mutaciones Comerciales** | Permisivo: inserciones directas en `pool_members`, `offers` y `confirmations`. | Políticas de inserción directa revocadas; ejecución exclusiva vía RPCs transaccionales. | Seguro y atómico. | Migración 4 + pruebas de integridad | **Aprobado** |
| **Inyección de Search Path** | Funciones `SECURITY DEFINER` sin search_path explícito. | Añadido `SET search_path = public, pg_temp;` y restricción de `EXECUTE`. | Seguro contra secuestro de esquema. | Migración 4 SQL | **Aprobado** |
| **Persistencia de Mensajería** | Adaptador en memoria temporal (`demoAdapter`). | Tablas `conversations`, `participants`, `messages` con RLS y `supabaseAdapter`. | Persistente entre reinicios y sesiones. | `tests/messaging-security.test.ts` | **Aprobado** |
| **Filtro Anti-Desintermediación** | Solo en frontend de demo. | Validación estricta en servidor para teléfonos, correos y enlaces web. | Filtrado obligatorio en backend y UI. | `tests/messaging-security.test.ts` | **Aprobado** |
| **Ventas entre Zonas Cercanas** | Rechazaba cualquier lote con zona distinta a la del pool. | Función `are_zones_compatible` (radio hasta 80 km / pares NEA). | Productores de zonas cercanas pueden sumarse. | `tests/geo-compatible-pool.test.ts` | **Aprobado** |
| **Simulador de Fletes** | Datos cableados a demo; actualización de estado en `useMemo`. | Integración con miembros reales del pool y cálculo puro en `useMemo`. | Simulación con datos reales y sin advertencias React 19. | `tests/freight-integration.test.ts` | **Aprobado** |
| **Configuración de Linting** | `next lint` fallaba por configuración interactiva con ESLint 9. | Creado `eslint.config.mjs` con FlatConfig compatible con Next.js 15. | Linting automatizado limpio (`code 0`). | `npm run lint` | **Aprobado** |
| **Verificación de Tipos TypeScript** | Fallos por módulos no instalados y tipos de DB faltantes. | `npm i` completado y tipado `Database` actualizado con tablas de mensajería. | 0 errores de compilación (`code 0`). | `npx tsc --noEmit` | **Aprobado** |
| **Build de Producción** | No comprobado tras cambios. | 20 rutas compiladas y optimizadas para Vercel. | Build exitoso (`code 0`). | `npm run build` | **Aprobado** |
