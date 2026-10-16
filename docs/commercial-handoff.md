# YVYPASS — Commercial Engine Handoff & Integration Guide

> **Módulo:** Persona 3 — Motor de Ventas Conjuntas, Ofertas, Confirmaciones y Comercialización  
> **Equipo:** Ideathon Corrientes 2026  
> **Estado:** COMPLETADO, VERIFICADO Y LISTO PARA INTEGRACIÓN  
> **Rama de trabajo:** `feature/comercial`

---

## 1. Resumen Ejecutivo del Módulo

Persona 3 implementó con éxito el núcleo comercial de **YvyPass**:
- La experiencia completa de exploración y filtrado reactivo de ventas conjuntas.
- La visualización detallada del progreso de cabezas con accesibilidad y diseño adaptado al productor mayor de 60 años.
- El selector de lotes compatibles e indivisibles y el diálogo de adhesión que conecta directamente con la transacción atómica PostgreSQL (`rpc_join_pool`), cumpliendo la prueba central de **350 a 400 cabezas** y transición automática a `objetivo_alcanzado`.
- El flujo de presentación de ofertas indicativas por kilogramo para compradores habilitados.
- El panel de confirmación y toma de decisiones individual para productores participantes con cálculo estricto de productores únicos.
- El panel de control y cierre demostrativo del operador habilitado cuando el 100% de los productores aceptó la propuesta.
- La pantalla demostrativa de remate virtual simulado con martillero, temporizador interactivo y aviso legal regulatorio.

---

## 2. Inventario de Archivos Creados

```
components/
  pools/
    PoolStatusBadge.tsx       -> Indicador visual de estado comercial con alto contraste y accesibilidad.
    PoolProgress.tsx          -> Barra de progreso de cabezas (350/400 = 87.5%), cálculo de faltantes y accesibilidad ARIA.
    PoolCard.tsx              -> Tarjeta de venta conjunta para grillas y listados con botón táctil >= 44px.
    PoolFilters.tsx           -> Filtros instantáneos por Zona, Categoría y Estado sin recarga de página.
    PoolList.tsx              -> Explorador de pools con estados de carga, vacío, error y reintento.
    PoolMembers.tsx           -> Lotes participantes, productores asociados y retiro de lote propio (Módulo D).
    CompatibleLotSelector.tsx -> Selector visual de lotes con estados compatibles e incompatibles deshabilitados con explicación.
    JoinPoolDialog.tsx        -> Modal accesible de adhesión de lote con confirmación y feedback de impacto (350 -> 400).
    PoolTimeline.tsx          -> Línea de tiempo con historial de eventos comerciales en lenguaje criollo comprensible.
    PoolDetail.tsx            -> Contenedor orquestador del detalle de pool adaptado según el rol del usuario.

  offers/
    OfferForm.tsx             -> Formulario para que el comprador presente precio indicativo por kg con resumen en tiempo real.
    OfferCard.tsx             -> Tarjeta de oferta recibida con comprador, fecha y estado.
    OffersList.tsx            -> Listado histórico de ofertas comerciales del pool.
    OfferConfirmation.tsx     -> Panel de decisión individual (Aceptar/Rechazar propuesta) para el productor miembro.
    ConfirmationProgress.tsx  -> Conteo y barra de confirmaciones por productores únicos ("3 de 4 productores confirmaron").

  operator/
    OperatorPoolPanel.tsx     -> Panel de supervisión de negociación y cierre comercial para el operador.
    ClosePoolDialog.tsx       -> Modal de confirmación del cierre demostrativo con advertencia regulatoria.

  remates/
    AuctionLotCard.tsx        -> Tarjeta de lote dentro de la subasta con cartel destacado de "SIMULACIÓN".
    AuctionDemo.tsx           -> Demostración de remate virtual simulado con reloj de martillero y pujas locales.

features/commercial/
  formatters.ts               -> Cálculos matemáticos de progreso, formateo de pesos ($/kg), cabezas y fechas NEA.
  compatibility.ts            -> Reglas de compatibilidad de lotes (categoría, zona, lote indivisible y capacidad restante).
  presentation.ts             -> Textos amigables, etiquetas accesibles y traducciones de eventos sin jerga técnica.
  view-models.ts              -> Transformación de modelos de datos, conteo de productores únicos y validación de cierre.
  client-service.ts           -> Adaptador tipado seguro para llamadas desde Client Components conectadas a Supabase.

tests/
  commercial.test.ts          -> Suite de 20 pruebas unitarias y de integración de lógica comercial (100% pasando).

docs/
  commercial-contract.md      -> Especificación de contratos, firmas de servicios y modelos de datos.
  commercial-handoff.md       -> Guía de integración para Persona 2 y Persona 4.
```

---

## 3. Instrucciones de Integración para Persona 2 (Frontend & Rutas)

Todos los componentes son Client Components (`"use client"`) auto-contenidos, listos para importar directamente en las páginas de Next.js App Router:

### 3.1 Ruta `/pools` (Explorador de Pools)
```tsx
// app/pools/page.tsx
import { PoolList } from "@/components/pools/PoolList";

export default function PoolsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Ventas Conjuntas de Ganado
      </h1>
      <PoolList />
    </main>
  );
}
```

### 3.2 Ruta `/pools/[id]` (Detalle Comercial de un Pool)
```tsx
// app/pools/[id]/page.tsx
import { getPoolDetail } from "@/features/pools/queries";
import { getCurrentProfile } from "@/features/auth/queries";
import { PoolDetail } from "@/components/pools/PoolDetail";
import { notFound } from "next/navigation";

export default async function PoolDetailPage({ params }: { params: { id: string } }) {
  const [poolRes, profileRes] = await Promise.all([
    getPoolDetail(params.id),
    getCurrentProfile(),
  ]);

  if (!poolRes.data) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <PoolDetail
        initialPool={poolRes.data}
        currentUserId={profileRes.data?.id}
        userRole={profileRes.data?.role || "productor"}
      />
    </main>
  );
}
```

### 3.3 Ruta `/comprador` (Vista para Compradores)
Permite al comprador filtrar pools que alcanzaron su objetivo y ofertar:
```tsx
// app/comprador/page.tsx
import { PoolList } from "@/components/pools/PoolList";

export default function BuyerPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Oportunidades de Compra Conjunta
      </h1>
      <PoolList />
    </main>
  );
}
```

### 3.4 Ruta `/operador` (Panel del Operador)
Permite al operador visualizar pools en negociación y ejecutar el cierre demostrativo:
```tsx
// app/operador/page.tsx
import { PoolList } from "@/components/pools/PoolList";

export default function OperatorPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Supervisión Comercial de Pools
      </h1>
      <PoolList />
    </main>
  );
}
```

### 3.5 Ruta `/remates` (Demostración de Remate Virtual)
```tsx
// app/remates/page.tsx
import { AuctionDemo } from "@/components/remates/AuctionDemo";

export default function RematesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <AuctionDemo />
    </main>
  );
}
```

---

## 4. Instrucciones para Persona 4 (QA y Deploy)

### 4.1 Ejecución del Recorrido de Demostración (350 -> 400 Novillos)

1. **Estado Inicial:**
   - Iniciar sesión como `productor.d@yvypass.com.ar` (Don Pedro Morales).
   - Abrir el pool `Pool Novillos Curuzú Cuatiá 400 (DEMO)`.
   - Verificar visualmente:
     - 350 / 400 cabezas (87,5%).
     - Faltan 50 cabezas.
     - Estado: **Abierto**.
     - Miembros: 3 lotes sumados (Don Juan Romero: 120, Doña Carmen Silva: 80, Cabaña Las Lilas NEA: 150).
2. **Acción de Adhesión (Prueba Clave del Ideathon):**
   - Don Pedro Morales hace clic en **"Sumar mis animales"**.
   - Se abre el diálogo modal.
   - Don Pedro ve sus 2 lotes:
     - Lote de 50 novillos: **Compatible (Habilitado)**.
     - Lote de 70 terneros: **Incompatible (Deshabilitado con cartel: Categoría ternero incompatible con novillo)**.
   - Don Pedro selecciona el lote de 50 novillos y presiona **"Confirmar y sumar lote"**.
   - La operación atómica PostgreSQL `rpc_join_pool` se ejecuta.
3. **Verificación de Impacto Inmediato:**
   - Cabezas: **400 / 400 cabezas (100%)**.
   - Estado comercial: **Objetivo alcanzado**.
   - Evento comercial registrado en la línea de tiempo: `lot_joined` y `pool_target_reached`.
   - El botón de sumar animales queda deshabilitado ya que el pool no acepta más animales.
4. **Oferta del Comprador:**
   - Iniciar sesión como `comprador.litoral@yvypass.com.ar` (Frigorífico del Litoral).
   - Abrir el pool de 400 novillos.
   - Ingresar en el formulario de oferta el precio `$ 2.950` por kg.
   - Enviar la propuesta indicativa.
   - El pool pasa automáticamente a **En negociación**.
5. **Confirmaciones de Productores:**
   - Los productores Don Juan, Doña Carmen, Cabaña Las Lilas y Don Pedro abren el pool y aceptan la propuesta en `OfferConfirmation`.
   - La barra de confirmaciones avanza: "1 de 4", "2 de 4", "3 de 4", "4 de 4 confirmaron (100% aceptaron)".
6. **Cierre Demostrativo por el Operador:**
   - Iniciar sesión como `operador@yvypass.com.ar`.
   - Acceder al panel de operador en el detalle del pool.
   - Validar que el botón **"Registrar cierre de demostración"** ahora está habilitado.
   - Confirmar el cierre en el modal con advertencia regulatoria.
   - El pool pasa a **Operación cerrada**. Los lotes pasan a estado **Vendido**.

---

## 5. Resultados de Pruebas Automatizadas

Vitest ejecutado con TypeScript estricto (`npm test`):
- **tests/commercial.test.ts**: 20 pruebas ejecutadas, **20 aprobadas (100%)**.
- **tests/business-rules.test.ts**: 15 pruebas ejecutadas, **15 aprobadas (100%)**.
- **tests/validators.test.ts**: 12 pruebas ejecutadas, **12 aprobadas (100%)**.
- **Total:** **47 pruebas pasando limpiamente (0 errores)**.
- Compilación de TypeScript (`npx tsc --noEmit`): **0 errores**.

---

## 6. Limitaciones Regulatorias y Funcionalidades Simuladas

1. **Entorno de Demostración:** La plataforma registra intenciones comerciales conjuntas y acuerdos de precios indicativos entre productores y compradores. No reemplaza la emisión formal del DTA/e-DTA ante SENASA, la guía provincial de traslado de hacienda ni las liquidaciones oficiales exigidas por AFIP/ARCA.
2. **Remates Virtuales:** El módulo `/remates` (`AuctionDemo.tsx`) es una demostración visual e interactiva; no procesa pagos, tarjetas de crédito ni adjudicaciones legales.
3. **Regla de Indivisibilidad:** En esta versión MVP no se permite fraccionar lotes al momento de la adhesión. Un lote de 80 animales no puede dividirse en 50 para un pool que solo necesita 50 cabezas.
