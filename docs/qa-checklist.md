# YVYPASS — Plan de Calidad y Matriz de Pruebas (QA Checklist)

> **Versión:** 1.0.0  
> **Estado:** VERIFICADO Y AUDITADO  
> **Responsable:** Persona 4 (QA, Mapas, Fletes, Integración)  
> **Fecha:** Ideathon Corrientes 2026

---

## 1. Clasificación de Severidad de Incidentes

| Severidad | Criterio de Impacto | Política de Acción en Ideathon |
| :--- | :--- | :--- |
| **P0 — Bloqueante** | La app no inicia, login falla, no se registra lote, no funciona la adhesión a pools, fuga de datos privados, deploy caído. | **Detención inmediata** de nuevas features. Resolución prioritaria antes de cualquier demo. |
| **P1 — Importante** | Mapa no muestra marcadores, simulación calcula erróneamente, móvil rompe diseño crítico, fallan enlaces de WhatsApp. | Resolución prioritaria en la ventana de QA. |
| **P2 — Secundario** | Ajustes cosméticos, alineaciones menores, animaciones, textos secundarios. | Se resuelven únicamente si queda tiempo disponible antes del cierre. |

---

## 2. Checklist de Pruebas de Interfaz y Responsividad

| Dispositivo / Resolución | Elemento a Evaluar | Criterio de Éxito | Estado |
| :--- | :--- | :--- | :--- |
| **Móvil (375 px)** | Mapa `YvyMap` | Mapa visible sin desbordamiento horizontal; popup legible y accionable. | [x] SUPERADO |
| **Móvil (375 px)** | Formularios de Flete | Inputs táctiles accesibles ($\ge 44$ px); sliders utilizables con pulgar. | [x] SUPERADO |
| **Móvil (375 px)** | Botón de WhatsApp | Abre enlace `wa.me` correctamente; texto no se corta. | [x] SUPERADO |
| **Tablet (768 px)** | Grilla de Comparativa | Distribución en 2 columnas equilibrada; tarjetas de fácil lectura. | [x] SUPERADO |
| **Escritorio (1366 px)** | Visualización General | Correcto aprovechamiento del ancho de pantalla; tipografía nítida. | [x] SUPERADO |
| **Todos** | Contraste y Accesibilidad | Etiquetas `<label>` asociadas a IDs de `<input>`; colores legibles. | [x] SUPERADO |

---

## 3. Matriz de Pruebas de Integración End-to-End (Recorrido de Demo)

1. [x] **Inicio de Sesión:** Productor y Comprador ingresan con credenciales de demo generadas (`scripts/create-demo-users.ts`).
2. [x] **Publicación de Lote:** Productor registra un lote ganadero con validación Zod (`head_count > 0`, peso positivo).
3. [x] **Visibilidad en Red:** El lote aparece en listado comercial con estado `disponible`.
4. [x] **Localización Segura en Mapa:** El lote se posiciona en el centroide de su zona pública autorizada (ej. Mercedes), **sin revelar coordenadas privadas del campo**.
5. [x] **Adhesión a Pool:** Productor adhiere lote de 50 novillos al pool de 350 novillos de Corrientes Centro.
6. [x] **Actualización de Cabezas:** `current_heads` del pool pasa a 400/400 atómicamente.
7. [x] **Transición de Estado:** El pool cambia su estado automáticamente a `objetivo_alcanzado`.
8. [x] **Oferta de Comprador:** Comprador emite oferta indicativa por kg; pool pasa a `en_negociacion`.
9. [x] **Confirmación de Miembros:** Todos los productores miembros aceptan la oferta comercial.
10. [x] **Cierre Demostrativo:** El operador comercial ejecuta `closePool` marcando la operación como concluida.
11. [x] **Integración con Simulador:** El flete toma las cabezas reales (40 cabezas para demostración de jaula) y calcula costos unitarios.
12. [x] **Canal WhatsApp:** Los enlaces de consulta y compartir generan la URL oficial `https://yvypass.vercel.app` y abren WhatsApp sin errores.

---

## 4. Pruebas Unitarias Ejecutadas con Vitest

- **Total de pruebas en suite:** 62 tests
- **Tests aprobados:** 62 / 62 (100% de éxito)
- **Archivos de prueba:**
  - `tests/freight.test.ts`: Fórmulas paramétricas, división por cero, capacidad de jaula, ahorro vs sobrecosto, reparto proporcional y reconciliación de centavos.
  - `tests/geography.test.ts`: Filtros de mapa, resguardo de privacidad zonal, centroides de Corrientes, normalización telefónica y codificación de links `wa.me`.
  - `tests/business-rules.test.ts`: Reglas de adhesión a pools, prevención de doble reserva, consistencia transaccional.
  - `tests/validators.test.ts`: Esquemas Zod de lotes, pools y ofertas.

---

## 5. Control de Permisos y Políticas RLS

- [x] Las consultas de lotes y pools públicos no exponen campos sensibles (teléfonos privados o coordenadas catastrales).
- [x] La edición de lotes está restringida exclusivamente a su dueño mediante `owner_id = auth.uid()`.
- [x] El cierre demostrativo solo puede ser ejecutado por usuarios con rol `operador`.
- [x] No es posible adherir un lote a un pool con categoría ganadera incompatible.
