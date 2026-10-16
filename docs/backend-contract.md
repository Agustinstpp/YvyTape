# YVYPASS — Backend Contract & Service Specifications

> **Versión:** 1.0.0  
> **Estado:** ESTABLE / CONTRATO VIGENTE  
> **Fecha:** Ideathon Corrientes 2026  
> **Responsable:** Persona 1 (Backend, Database, Auth & Security)

Este documento define formalmente la interfaz de datos, contratos de servicio TypeScript, políticas de roles y comportamientos transaccionales garantizados por el backend de **YvyPass**.

---

## 1. Convenciones y Arquitectura de Respuestas

Todas las mutaciones y consultas públicas del backend devuelven una estructura unificada:

```typescript
export interface ApiResult<T> {
  data: T | null;
  error: {
    code: string;       // e.g. "UNAUTHORIZED", "FORBIDDEN", "VALIDATION_ERROR", "CONFLICT", "BUSINESS_RULE_VIOLATION"
    message: string;    // Mensaje legible en español apto para feedback de UI
    details?: unknown;  // Detalles de validación (e.g. issues de Zod)
  } | null;
}
```

### Reglas Globales:
1. **La identidad del usuario NUNCA se confía del frontend:** El `user_id` y el `role` se extraen directamente de la sesión criptográfica de Supabase Auth en el servidor y de la tabla protegida `profiles`.
2. **Current heads es dinámico:** `current_heads` en los pools se calcula sumando el `head_count` de los lotes miembros y no se almacena como una columna editable por el cliente.
3. **Manejo de Transacciones:** Operaciones comerciales críticas (`joinPool`, `leavePool`, `createOffer`, `confirmOffer`, `closePool`) son atómicas en PostgreSQL mediante transacciones con bloqueo de fila (`SELECT ... FOR UPDATE`), evitando condiciones de carrera y dobles reservas.

---

## 2. Tipos Centrales y Catálogos

```typescript
export type UserRole = "productor" | "comprador" | "operador";

export type LivestockCategory =
  | "ternero"
  | "ternera"
  | "novillo"
  | "vaquillona"
  | "vaca"
  | "toro";

export type VerificationStatus = "declarado" | "pendiente" | "revisado";

export type LotStatus = "disponible" | "reservado" | "vendido";

export type PoolStatus =
  | "abierto"
  | "objetivo_alcanzado"
  | "en_negociacion"
  | "cerrado"
  | "cancelado";

export type OfferStatus = "pendiente" | "aceptada" | "rechazada";
```

---

## 3. Especificación Detallada de Servicios

### 3.1 Autenticación y Perfil

#### `getCurrentProfile()`
- **Rol Autorizado:** Cualquier usuario autenticado (`productor`, `comprador`, `operador`).
- **Entrada:** Ninguna (toma la sesión activa).
- **Salida:** `ApiResult<Profile>`
- **Errores Posibles:** `UNAUTHORIZED` (no hay sesión activa), `NOT_FOUND` (perfil inexistente).
- **Efectos en DB:** Lectura de `profiles`.

---

### 3.2 Establecimientos (Farms)

#### `getMyFarms()`
- **Rol Autorizado:** `productor`.
- **Entrada:** Ninguna.
- **Salida:** `ApiResult<Farm[]>`
- **Errores Posibles:** `UNAUTHORIZED`, `FORBIDDEN` (no es productor).
- **Efectos en DB:** Lectura filtrada por RLS `owner_id = auth.uid()`.

#### `createFarm(input: CreateFarmInput)`
- **Rol Autorizado:** `productor`.
- **Entrada:**
  ```typescript
  {
    name: string;
    zone: string;
    province?: string; // Por defecto "Corrientes"
    approximate_lat?: number | null;
    approximate_lng?: number | null;
  }
  ```
- **Salida:** `ApiResult<Farm>`
- **Validaciones:** `name` min 3 caracteres, `zone` min 2 caracteres.
- **Errores Posibles:** `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`.
- **Efectos en DB:** Inserta fila en `farms` asignando `owner_id = auth.uid()`.

---

### 3.3 Lotes Ganaderos (Livestock Lots)

#### `getMyLots()`
- **Rol Autorizado:** `productor`.
- **Entrada:** Ninguna.
- **Salida:** `ApiResult<LivestockLotWithFarm[]>`
- **Errores:** `UNAUTHORIZED`, `FORBIDDEN`.
- **Efectos en DB:** Lectura de `livestock_lots` filtrado por `producer_id = auth.uid()`.

#### `createLot(input: CreateLotInput)`
- **Rol Autorizado:** `productor`.
- **Entrada:**
  ```typescript
  {
    farm_id: string; // UUID
    title: string;
    category: LivestockCategory;
    breed: string;
    head_count: number; // Entero > 0
    average_weight_kg: number; // Positivo > 0
    electronic_tag_reference?: string | null;
  }
  ```
- **Salida:** `ApiResult<LivestockLot>`
- **Validaciones Zod:** `head_count > 0`, `average_weight_kg > 0`, categoría válida, `farm_id` perteneciente al productor.
- **Errores:** `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND` (farm ajena o inexistente).
- **Efectos en DB:** Inserta fila en `livestock_lots` con `status = 'disponible'` y `verification_status = 'declarado'`.

#### `updateLot(id: string, input: UpdateLotInput)`
- **Rol Autorizado:** `productor` (propietario del lote).
- **Entrada:** `id: string`, campos parciales editables.
- **Salida:** `ApiResult<LivestockLot>`
- **Validaciones:** Solo se puede editar si `status === 'disponible'`. No se pueden editar lotes en pools (`reservado`) ni `vendido`.
- **Errores:** `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT` (lote en pool o vendido).
- **Efectos en DB:** Actualiza fila en `livestock_lots`.

#### `getAvailableLots(filters?: LotFilters)`
- **Rol Autorizado:** Todos (público / autenticado).
- **Entrada:** Filtros opcionales `{ category, zone, min_heads, max_heads }`.
- **Salida:** `ApiResult<LivestockLotWithFarm[]>`
- **Efectos en DB:** Lectura segura donde `status = 'disponible'`. Protege datos sensibles (coordenadas exactas y teléfonos privados son omitidos en consultas anónimas).

---

### 3.4 Pools de Venta Conjunta (Sales Pools)

#### `getPools(filters?: PoolFilters)`
- **Rol Autorizado:** Todos (público / autenticado).
- **Entrada:** Filtros opcionales `{ category, zone, status }`.
- **Salida:** `ApiResult<PoolSummary[]>`
- **Efectos en DB:** Lectura de `sales_pools` calculando `current_heads` y cantidad de miembros agregados.

#### `getPoolDetail(id: string)`
- **Rol Autorizado:** Todos (público / autenticado).
- **Entrada:** `id: string` (UUID).
- **Salida:** `ApiResult<PoolDetail>`
- **Efectos en DB:** Retorna el pool con sus miembros agregados, lotes asociados, oferta activa (si existe) y el historial de eventos comerciales.

#### `createPool(input: CreatePoolInput)`
- **Rol Autorizado:** `operador` o `productor` habilitado.
- **Entrada:**
  ```typescript
  {
    title: string;
    zone: string;
    category: LivestockCategory;
    target_heads: number; // e.g. 400
  }
  ```
- **Salida:** `ApiResult<SalesPool>`
- **Validaciones:** `target_heads > 0`, categoría permitida.
- **Efectos en DB:** Inserta fila con `status = 'abierto'`, registra evento comercial `pool_created`.

#### `joinPool(poolId: string, lotId: string)`
- **Rol Autorizado:** `productor` (dueño de `lotId`).
- **Entrada:** `poolId: string`, `lotId: string`.
- **Salida:**
  ```typescript
  ApiResult<{
    success: boolean;
    current_heads: number;
    target_heads: number;
    pool_status: PoolStatus;
  }>
  ```
- **Validaciones & Garantías Atómicas:**
  1. Verifica que el usuario autenticado sea dueño del lote.
  2. Verifica que el lote tenga estado `disponible`.
  3. Verifica compatibilidad estricta de `category` y `zone` entre lote y pool.
  4. Bloquea el lote y el pool mediante transacción.
  5. Verifica que el pool esté `abierto`.
  6. Comprueba que el lote no esté adherido ya a ningún pool activo.
  7. Calcula `current_heads + lot.head_count`.
  8. Si excede `target_heads`, rechaza con `BUSINESS_RULE_VIOLATION`.
  9. Inserta en `pool_members`.
  10. Pasa el lote a estado `reservado`.
  11. Si `nuevo_total === target_heads`, actualiza el pool a `objetivo_alcanzado` y emite evento `pool_target_reached`.
  12. Emite evento comercial `lot_joined`.
- **Errores:** `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `BUSINESS_RULE_VIOLATION`.

#### `leavePool(poolId: string, lotId: string)`
- **Rol Autorizado:** `productor` (dueño de `lotId`).
- **Entrada:** `poolId: string`, `lotId: string`.
- **Salida:** `ApiResult<{ success: boolean; current_heads: number; pool_status: PoolStatus }>`
- **Validaciones:**
  1. Solo permitido si el pool está en `abierto` u `objetivo_alcanzado` SIN ofertas activas en negociación.
  2. Libera el lote a `disponible`.
  3. Elimina el registro de `pool_members`.
  4. Si el pool estaba en `objetivo_alcanzado`, regresa a `abierto`.
  5. Registra evento comercial `lot_left`.
- **Errores:** `FORBIDDEN`, `BUSINESS_RULE_VIOLATION` (pool en negociación o cerrado).

---

### 3.5 Ofertas Comerciales y Cierre Demostrativo

#### `createOffer(poolId: string, input: CreateOfferInput)`
- **Rol Autorizado:** `comprador`.
- **Entrada:** `poolId: string`, `{ price_per_kg: number }`.
- **Salida:** `ApiResult<Offer>`
- **Validaciones:**
  1. El comprador debe estar autenticado con rol `comprador`.
  2. El pool debe encontrarse en estado `objetivo_alcanzado`.
  3. `price_per_kg > 0`.
  4. No debe existir otra oferta activa pendiente en el pool.
- **Efectos en DB:**
  - Inserta en `offers` con `status = 'pendiente'`.
  - Actualiza el estado del pool a `en_negociacion`.
  - Registra evento comercial `offer_created`.

#### `getPoolOffers(poolId: string)`
- **Rol Autorizado:** Productores miembros del pool, el Comprador emisor, y Operadores.
- **Entrada:** `poolId: string`.
- **Salida:** `ApiResult<Offer[]>` (incluye el estado de confirmaciones de los miembros).

#### `confirmOffer(offerId: string, accepted: boolean)`
- **Rol Autorizado:** `productor` con lote dentro del pool ofertado.
- **Entrada:** `offerId: string`, `accepted: boolean`.
- **Salida:**
  ```typescript
  ApiResult<{
    success: boolean;
    all_confirmed: boolean;
    total_producers: number;
    confirmed_producers: number;
  }>
  ```
- **Validaciones:**
  1. El productor autenticado debe tener un lote miembro en el pool de esa oferta.
  2. No se permiten dobles confirmaciones (idempotencia en `offer_confirmations`).
  3. No se puede confirmar ofertas en nombre de terceros.
- **Efectos en DB:**
  - Registra fila en `offer_confirmations`.
  - Registra evento `offer_confirmed` o `offer_rejected`.
  - Si un productor rechaza, la oferta pasa a `rechazada` y el pool regresa a `objetivo_alcanzado`.

#### `closePool(poolId: string)`
- **Rol Autorizado:** `operador`.
- **Entrada:** `poolId: string`.
- **Salida:** `ApiResult<{ success: boolean; message: string }>`
- **Validaciones:**
  1. Solo un usuario con rol `operador` puede invocar este cierre.
  2. El pool debe tener una oferta activa donde **el 100% de los productores miembros hayan aceptado**.
- **Efectos en DB:**
  - Marca la oferta como `aceptada`.
  - Marca el pool como `cerrado`.
  - Marca todos los lotes miembros como `vendido` (en contexto DEMO).
  - Registra evento `pool_closed` con detalles de cierre demostrativo.

#### `getCommercialHistory(poolId: string)`
- **Rol Autorizado:** Todos (público / autenticado).
- **Entrada:** `poolId: string`.
- **Salida:** `ApiResult<CommercialEvent[]>`
- **Efectos en DB:** Consulta ordenada cronológicamente de `commercial_events` para trazabilidad y auditoría.

---

## 4. Escenario Demostrativo Obligatorio (350 a 400 Novillos)

1. **Pool ID "Novillos NEA 400":**
   - Categoría: `novillo`
   - Zona: `Corrientes Centro`
   - Objetivo: `400`
   - Estado Inicial: `abierto`
   - Productores iniciales:
     - Productor A: 120 novillos
     - Productor B: 80 novillos
     - Productor C: 150 novillos
     - **Subtotal Inicial: 350 novillos**
2. **Acción de Demostración:**
   - Productor D ingresa con su lote disponible de **50 novillos**.
   - Invoca `joinPool(poolId, lotId_D)`.
   - El backend bloquea las filas, suma $350 + 50 = 400$, pasa el lote a `reservado`, actualiza el pool a `objetivo_alcanzado` y emite el evento `pool_target_reached`.
   - Comprador X oferta precio indicativo por kg.
   - Productores A, B, C y D confirman.
   - Operador cierra demostrativamente la operación comercial.
