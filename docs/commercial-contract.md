# YVYPASS — Commercial Engine Contract & Interface Specifications

> **Versión:** 1.0.0  
> **Estado:** VIGENTE / CONTRATO COMERCIAL  
> **Fecha:** Ideathon Corrientes 2026  
> **Responsable:** Persona 3 (Motor de Pools, Ofertas, Confirmaciones y Comercialización)

Este documento define formalmente los contratos, adaptadores tipados, modelos de presentación (View-Models) y especificaciones de componentes UI que implementa la **Persona 3** para integrarse con los servicios de **Persona 1** y las pantallas de **Persona 2**.

---

## 1. Servicios Backend Consumidos (Persona 1)

Todos los servicios consumidos respetan la firma `Promise<ApiResult<T>>`:

```typescript
export interface ApiResult<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}
```

| Función | Origen | Parámetros | Retorno | Propósito |
|---|---|---|---|---|
| `getPools` | `@/features/pools/queries` | `filters?: PoolFilters` | `PoolSummary[]` | Listado general con cálculo dinámico de cabezas y miembros |
| `getPoolDetail` | `@/features/pools/queries` | `id: string` | `PoolDetail` | Detalle del pool con miembros, lotes, oferta activa e historial |
| `getMyLots` | `@/features/lots/queries` | Ninguno | `LivestockLotWithFarm[]` | Lotes del productor autenticado para selector de adhesión |
| `joinPool` | `@/features/pools/mutations` | `poolId: string, lotId: string` | `{ success, current_heads, target_heads, pool_status }` | Adhesión atómica de un lote (caso demo 350 -> 400 cabezas) |
| `leavePool` | `@/features/pools/mutations` | `poolId: string, lotId: string` | `{ success, current_heads, pool_status }` | Retiro atómico de lote de pool abierto |
| `createOffer` | `@/features/offers/mutations` | `poolId: string, input: { price_per_kg }` | `{ id, message }` | Registro de oferta indicativa por parte de un comprador |
| `getPoolOffers` | `@/features/offers/queries` | `poolId: string` | `Offer[]` | Historial de ofertas de un pool con confirmaciones |
| `confirmOffer` | `@/features/offers/mutations` | `offerId: string, accepted: boolean` | `{ success, all_confirmed, total_producers, confirmed_producers, message }` | Decisión individual de cada productor participante |
| `closePool` | `@/features/offers/mutations` | `poolId: string` | `{ success, message }` | Cierre demostrativo por operador habilitado |
| `getCommercialHistory` | `@/features/pools/queries` | `poolId: string` | `CommercialEvent[]` | Auditoría cronológica de eventos comerciales del pool |

---

## 2. Tipos de Dominio y Estados Comerciales

```typescript
export type PoolStatus =
  | "abierto"
  | "objetivo_alcanzado"
  | "en_negociacion"
  | "cerrado"
  | "cancelado";

export type OfferStatus = "pendiente" | "aceptada" | "rechazada";

export type LivestockCategory =
  | "ternero"
  | "ternera"
  | "novillo"
  | "vaquillona"
  | "vaca"
  | "toro";

export type LotStatus = "disponible" | "reservado" | "vendido";
```

### Reglas de Estado:
1. **abierto:** El pool acepta lotes compatibles mientras `current_heads + lot.head_count <= target_heads`.
2. **objetivo_alcanzado:** `current_heads === target_heads`. Se bloquean nuevas adhesiones. El pool está habilitado para recibir ofertas indicativas de compradores.
3. **en_negociacion:** Existe una oferta en estado `pendiente`. Los productores participantes deben aceptar o rechazar individualmente.
4. **cerrado:** Operación demostrativa cerrada por el operador tras el 100% de aceptaciones. Lotes quedan en estado `vendido`.
5. **cancelado:** Pool dado de baja comercialmente.

---

## 3. Capa de Lógica y Adaptación Comercial (`features/commercial/`)

Para desacoplar componentes visuales de Supabase y asegurar que la lógica de cálculo y validación sea testeable de forma pura con Vitest:

### 3.1 `formatters.ts`
- `formatHeads(heads: number): string` ("400 cabezas")
- `formatCurrencyKg(price: number): string` ("$ 2.950 / kg")
- `formatWeight(weightKg: number): string` ("385 kg")
- `formatCommercialDate(isoDate: string): string` ("16/10/2026 15:30 hs")
- `calculateProgress(current: number, target: number): { percentage: number, remaining: number, isComplete: boolean }`

### 3.2 `compatibility.ts`
- `checkLotCompatibility(lot: LivestockLotWithFarm, pool: SalesPool, currentHeads: number): { isCompatible: boolean, reason?: string }`
  - Comprueba: estado `disponible`, categoría exacta, zona exacta, y no superación del remanente (`lot.head_count <= pool.target_heads - currentHeads`).
  - Regla MVP: **No se dividen lotes**. Si faltan 50 y el lote tiene 80, se indica: `"Este lote supera la cantidad de cabezas que falta reunir (50 cabezas restantes)."`.

### 3.3 `view-models.ts`
- Modelos transformados para consumo directo de componentes UI.
- Mapea `PoolDetail` a `PoolDetailViewModel`, calculando productores únicos, días abierto, estado del botón de cierre, etc.

### 3.4 `presentation.ts`
- Textos amigables para productores mayores de 60 años en lenguaje del NEA.
- Mapeo de estados a títulos, badges, descripciones y alertas.

---

## 4. Componentes UI Exportados para Persona 2

### 4.1 Pools (`components/pools/`)
- `PoolCard.tsx`: Tarjeta resumen de venta conjunta para grillas.
- `PoolList.tsx`: Grilla responsiva con soporte para estados vacíos y feedback.
- `PoolFilters.tsx`: Filtros instantáneos por Zona, Categoría y Estado.
- `PoolProgress.tsx`: Barra de progreso de cabezas con porcentaje y cabezas faltantes.
- `PoolDetail.tsx`: Contenedor principal de detalle de pool.
- `PoolMembers.tsx`: Lista de lotes y productores participantes en la venta.
- `JoinPoolDialog.tsx`: Diálogo para sumar lote propio de 50 cabezas al pool.
- `CompatibleLotSelector.tsx`: Selector visual de lotes con estados compatibles e incompatibles deshabilitados con explicación.
- `PoolStatusBadge.tsx`: Indicador visual del estado comercial con accesibilidad y alto contraste.
- `PoolTimeline.tsx`: Línea de tiempo de eventos comerciales del pool.

### 4.2 Ofertas (`components/offers/`)
- `OfferForm.tsx`: Formulario de comprador para precio indicativo por kg con resumen en tiempo real.
- `OfferCard.tsx`: Tarjeta de oferta indicativa recibida.
- `OffersList.tsx`: Listado de ofertas del pool.
- `OfferConfirmation.tsx`: Panel para que el productor acepte o rechace la propuesta comercial.
- `ConfirmationProgress.tsx`: Resumen de productores únicos confirmados ("3 de 4 productores confirmaron").

### 4.3 Operador (`components/operator/`)
- `OperatorPoolPanel.tsx`: Panel de control de pool en negociación con conteo de confirmaciones y botón de cierre condicional.
- `ClosePoolDialog.tsx`: Modal de confirmación con advertencia explícita sobre el entorno demostrativo.

### 4.4 Remate Virtual Simulado (`components/remates/`)
- `AuctionDemo.tsx`: Pantalla de simulación de remate virtual con martillero, temporizador y pujas de ejemplo.
- `AuctionLotCard.tsx`: Tarjeta de lote dentro del remate simulado con cartel de "Simulación".

---

## 5. Directrices de Accesibilidad (Productores Mayores de 60 Años)

1. Tipografía principal: mínimo 16px (`text-base`), títulos grandes y legibles (`text-xl` a `text-3xl`).
2. Botones y controles táctiles: mínimo 44px de alto (`min-h-[44px]`).
3. Alto contraste según directrices WCAG AA.
4. Términos ganaderos auténticos del NEA ("Venta conjunta", "Mis animales", "Sumar mi lote", "Cabezas reunidas", "Faltan X cabezas", "Propuesta comercial").
5. Prohibido exponer términos técnicos como `RPC`, `UUID`, `Mutation`, `Payload`, `RLS`.
