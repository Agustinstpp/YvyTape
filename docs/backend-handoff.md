# YVYPASS — Backend Handoff (Entrega Técnica a Personas 2, 3 y 4)

> **Destinatarios:**  
> - **Persona 2:** Interfaz, pantallas, layout, diseño y navegación.  
> - **Persona 3:** Componentes de pool, modal de adhesión, ofertas y confirmaciones.  
> - **Persona 4:** Mapa, georreferenciación, flete, QA y despliegue.  
> **Autor:** Persona 1 (Backend, Database, Auth & Security)  
> **Rama Git:** `feat/backend`

---

## 1. Resumen Ejecutivo del Backend

El backend de **YvyPass** se encuentra **100% operativo, tipado con TypeScript estricto, blindado con Row Level Security y validado con tests automatizados**.

Toda la lógica de negocio sensible (cálculo de cabezas, reserva atómica de lotes, exclusión de lotes incompatibles, ofertas únicas, confirmación individual y cierre demostrativo) se ejecuta de forma transaccional mediante procedimientos almacenados en PostgreSQL, garantizando integridad absoluta aún con concurrencia.

---

## 2. Dónde Importar las Funciones

Todos los servicios residen en la carpeta `features/` y pueden consumirse directamente tanto en Server Components, Server Actions o Route Handlers:

```typescript
// Perfil y Establecimientos
import { getCurrentProfile, getMyFarms, createFarm } from "@/features/auth/queries";

// Lotes Ganaderos
import { getMyLots, getAvailableLots } from "@/features/lots/queries";
import { createLot, updateLot } from "@/features/lots/mutations";

// Pools de Venta Conjunta
import { getPools, getPoolDetail, getCommercialHistory } from "@/features/pools/queries";
import { createPool, joinPool, leavePool } from "@/features/pools/mutations";

// Ofertas Comerciales y Cierre
import { getPoolOffers } from "@/features/offers/queries";
import { createOffer, confirmOffer, closePool } from "@/features/offers/mutations";
```

---

## 3. Guía de Uso Rápido por Funcionalidad

### 3.1 Consultar Catálogo de Pools con Cabezas Calculadas
```typescript
const result = await getPools({ category: "novillo", status: "abierto" });

if (result.error) {
  console.error(result.error.message);
} else {
  // result.data es PoolSummary[]
  // Nota: current_heads y members_count ya vienen calculados
  console.log(result.data[0].current_heads); // e.g. 350
  console.log(result.data[0].target_heads);  // e.g. 400
}
```

### 3.2 Productor Adhiere Lote al Pool (Transaccional)
```typescript
const result = await joinPool(poolId, lotId);

if (result.error) {
  // Errores legibles en español:
  // "Categoría incompatible...", "La adhesión de X cabezas superaría el objetivo..."
  alert(result.error.message);
} else {
  console.log(result.data.pool_status);  // "objetivo_alcanzado" si llegó a 400
  console.log(result.data.current_heads); // 400
}
```

### 3.3 Comprador Presenta Oferta Indicativa
```typescript
const result = await createOffer(poolId, { price_per_kg: 2950 });

if (result.error) {
  alert(result.error.message);
} else {
  alert("Oferta registrada. El pool pasa a estado en negociación.");
}
```

### 3.4 Productor Confirma Oferta
```typescript
const result = await confirmOffer(offerId, true); // true = acepta, false = rechaza

if (result.data?.all_confirmed) {
  alert("¡Todos los productores han confirmado! Listo para cierre de operador.");
}
```

### 3.5 Operador Realiza Cierre Demostrativo
```typescript
const result = await closePool(poolId);

if (result.error) {
  alert(result.error.message);
} else {
  alert("Operación cerrada exitosamente. Lotes marcados como vendidos.");
}
```

---

## 4. Estructura Estándar de Retorno (`ApiResult<T>`)

```typescript
export interface ApiResult<T> {
  data: T | null;
  error: {
    code: string;       // "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "BUSINESS_RULE_VIOLATION" | "INTERNAL_ERROR"
    message: string;    // Mensaje en español directo para mostrar en alerts o toasts
    details?: unknown;  // Detalles de Zod si aplica
  } | null;
}
```

---

## 5. Variables de Entorno Requeridas

Para iniciar el proyecto localmente (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 6. Estado de los Tests y Calidad

- **Suites de Tests:** 2 suites (`tests/validators.test.ts`, `tests/business-rules.test.ts`)
- **Total de Tests:** 27 pruebas unitarias y de integración de reglas.
- **Resultado:** 27 pasados (0 fallidos).
- **TypeScript:** 0 errores con compilación estricta (`tsc --noEmit`).

---

## 7. Pendientes Conocidos y Alcance

1. **Simulación de Demo:** El cierre comercial del operador es demostrativo (como exige la consigna de Ideathon). En producción requerirá la integración de firma digital y contratos formales.
2. **Caravanas Electrónicas:** El campo `electronic_tag_reference` es estrictamente una referencia declarada por el productor. No se conecta con SENASA real.
