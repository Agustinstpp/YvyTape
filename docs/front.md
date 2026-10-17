# YvyTape — Front

Pantallas hechas a partir del mockup de Claude Design. Usan **solo** los servicios que ya existen en `features/` y Supabase Auth; el front no agrega tablas ni lógica de negocio.

## Cómo correrlo

```bash
cp .env.example .env.local   # completar URL y anon key de Supabase
npm install
npm run dev                  # http://localhost:3000
```

Usuarios de prueba: los de `docs/demo-setup.md` (contraseña `YvyPass2026!`).

## Pantallas

| Ruta | Quién | Qué hace |
| --- | --- | --- |
| `/` | Todos | Landing |
| `/ingresar`, `/registrarse` | Todos | Ingreso y alta (productor o comprador). No se pide teléfono |
| `/inicio` | Productor | Panel: ofertas por responder, números, venta cercana sugerida |
| `/mis-lotes`, `/mis-lotes/nuevo`, `/mis-lotes/guardado` | Productor | Lotes y alta por pasos (crea el establecimiento si hace falta) |
| `/ventas-conjuntas`, `/ventas-conjuntas/nueva` | Productor | Lista (cerca mío, donde participo, todas) y alta de venta |
| `/ventas-conjuntas/[id]` | Todos con sesión | Detalle: sumar o sacar lote, ofertar (comprador), cerrar (martillero) |
| `/ventas-conjuntas/[id]/completar` | Productor y martillero | Mapa de localidades a 50 km con lotes disponibles de la misma categoría e invitación por Mensajes |
| `/ventas-conjuntas/[id]/oferta` | Productor | Responder la oferta con precio, peso y cobro estimado |
| `/ofertas`, `/ofertas/lote/[id]` | Comprador y visitantes | Ventas conjuntas y lotes individuales con filtros |
| `/oferta-enviada`, `/mis-ofertas` | Comprador | Estado de las ofertas |
| `/flete` | Todos | Simulador de flete de `feat/geografia-logistica` (`components/flete`). Recibe `?cabezas=` y `?venta=` |
| `/mapa` | Todos | Mapa regional de `feat/geografia-logistica` (`components/mapa`), con lotes y ventas reales por zona |
| `/mensajes`, `/mensajes/[id]`, `/mensajes/nueva` | Todos con sesión | Avisos y conversaciones |
| `/operador` | Martillero | Ventas ordenadas por etapa |

## Mensajes: adaptador temporal

El backend todavía no tiene mensajería. Las pantallas usan la interfaz `MensajesAdapter` de `lib/front/mensajes.ts`, hoy implementada con **datos de demostración en memoria** (se pierden al reiniciar y se muestran marcados como demostración).

Cuando exista la API, se reemplaza `demoAdapter` por una implementación que la llame, en ese único archivo. Lo que el front necesita del backend:

- Bandeja de conversaciones con último mensaje y si está sin leer.
- Conversación con sus mensajes.
- Iniciar consulta sobre una venta conjunta, un lote o al equipo.
- Enviar mensaje y marcar como leída.

Decisión de producto: **sin WhatsApp ni teléfonos**. `lib/front/contact-filter.ts` avisa en pantalla si un mensaje trae un teléfono, correo o enlace; conviene que el backend haga el mismo control.

## Avisos

No hay tabla de avisos: `lib/front/derivados.ts` los arma con los datos reales de las ventas (oferta por responder, venta que llegó al objetivo, venta cerrada).

## Limitaciones conocidas

- No existe una consulta de lote por id ni de "mis ofertas": se buscan entre los datos que ya devuelven los servicios. Alcanza para el volumen de la demo.
- `getPools` no trae los miembros, así que algunas pantallas piden el detalle de cada venta.

## Integración con geografía y logística

El front se arma sobre `feat/geografia-logistica` y usa sus componentes sin modificarlos:

- `/flete` usa `FreightCalculator`. Desde una venta o un lote se abre con la cantidad de cabezas cargada.
- `/mapa` usa `YvyMap` con lotes disponibles y ventas activas reales, convertidos con `getMapOffers`.
- Los marcadores del mapa enlazan a `/lotes/:id` y `/pools/:id`; `next.config.ts` los redirige a `/ofertas/lote/:id` y `/ventas-conjuntas/:id`.
- Los componentes de WhatsApp (`components/whatsapp`, `lib/utils/whatsapp.ts`) no se usan: la decisión del equipo es que toda la comunicación quede dentro de YvyTape.
