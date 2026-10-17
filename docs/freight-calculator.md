# YVYPASS — Simulador de Flete Ganadero y Reparto Logístico

> **Versión:** 1.0.0  
> **Estado:** PRODUCCIÓN / LISTO PARA INTEGRACIÓN  
> **Responsable:** Persona 4 (Mapas, Simulador de Flete, WhatsApp, QA e Integración)  
> **Fecha:** Ideathon Corrientes 2026

---

## 1. Resumen de Propósito

El módulo de logística permite al pequeño y mediano productor ganadero estimar el costo de trasladar su hacienda y **comparar con claridad el costo de un flete individual frente a una alternativa compartida en un pool de venta conjunta**, cuantificando el ahorro económico por cabeza y para la totalidad del lote.

---

## 2. Fórmulas Matemáticas y Modelo de Costos

### 2.1 Fórmula Paramétrica de Costo Total
$$\text{Costo Total} = \text{Costo Fijo Base} + (\text{Kilómetros} \times \text{Costo por Km}) + (\text{Paradas Intermedias} \times \text{Recargo por Parada})$$

### 2.2 Costo por Cabeza
$$\text{Costo por Cabeza} = \frac{\text{Costo Total}}{\text{Cabezas Transportadas}}$$
*(Con protección estricta contra división por cero: si cabezas $\le 0$, el costo unitario retorna $0$).*

### 2.3 Comparación Económica Individual vs. Compartido
$$\text{Ahorro por Cabeza} = \text{Costo por Cabeza Individual} - \text{Costo por Cabeza Compartido}$$
$$\text{Ahorro Total Productor} = \text{Costo Total Individual} - (\text{Costo por Cabeza Compartido} \times \text{Cabezas del Productor})$$
$$\text{Porcentaje de Ahorro} = \begin{cases} \left(\frac{\text{Ahorro por Cabeza}}{\text{Costo por Cabeza Individual}}\right) \times 100 & \text{si Costo Individual} > 0 \\ \text{null} & \text{si Costo Individual} = 0 \end{cases}$$

- **Ahorro positivo:** Se destaca con badge verde y cálculo de monto ahorrado.
- **Sobrecosto (ahorro negativo):** Si el desvío de kilómetros o la cantidad de paradas encarece el viaje compartido, el sistema advierte honestamente sobrecosto en lugar de forzar un ahorro irreal.

---

## 3. Escenario de Referencia Demostrativo (Ideathon 2026)

| Parámetro | Valor de Entrada |
| :--- | :--- |
| **Distancia del recorrido** | 200 km |
| **Costo fijo base** | $ 100.000 |
| **Costo por kilómetro** | $ 1.500 |
| **Paradas intermedias** | 2 paradas |
| **Recargo por parada** | $ 20.000 |
| **Cabezas transportadas** | 40 animales |
| **Capacidad declarada** | 48 cabezas |

### Resultado Calculado y Verificado por Tests:
$$\text{Costo Total} = 100.000 + (200 \times 1.500) + (2 \times 20.000) = 100.000 + 300.000 + 40.000 = \$ \mathbf{440.000}$$
$$\text{Costo por Cabeza} = \frac{440.000}{40} = \$ \mathbf{11.000}$$

---

## 4. Distribución Proporcional entre Productores

En un viaje compartido consolidado por 3 productores:
- **Productor A (Don Pedro):** 15 cabezas (37.5% de carga) $\rightarrow$ **$ 165.000** ($ 11.000 / cab.)
- **Productor B (El Ceibo):** 10 cabezas (25.0% de carga) $\rightarrow$ **$ 110.000** ($ 11.000 / cab.)
- **Productor C (Río Paraná):** 15 cabezas (37.5% de carga) $\rightarrow$ **$ 165.000** ($ 11.000 / cab.)
- **Total acumulado:** 40 cabezas $\rightarrow$ **$ 440.000**

El motor implementa **reconciliación de redondeo:** si por redondeo existiese una discrepancia de $1 o más pesos, se ajusta automáticamente sobre el aporte del mayoritario para asegurar que la suma de aportes coincida exactamente con el total facturado.

---

## 5. Control de Capacidad y Bienestar Animal

El usuario puede configurar una **capacidad máxima declarada** para el camión o jaula (por defecto 48 cabezas). Si las cabezas transportadas superan este límite:
- Se emite una alerta visual destacada indicando el exceso en cabezas.
- Se recuerda la necesidad de jaulas dobles o unidades adicionales según normativa sanitaria y bienestar animal.

---

## 6. Componentes Exportados

### 6.1 `components/flete/FreightCalculator.tsx`
Componente principal con interfaz en pestañas:
1. Calculador de viaje en tiempo real con sliders y campos numéricos.
2. Comparativa individual vs. flete compartido con tarjetas enfrentadas.
3. Reparto proporcional entre productores con tabla detallada.
- **Props:**
  ```typescript
  interface FreightCalculatorProps {
    initialHeads?: number;
    poolId?: string;
    className?: string;
  }
  ```

### 6.2 `components/flete/FreightComparison.tsx`
Tarjeta comparativa de ahorro y métricas de impacto económico.

### 6.3 `components/flete/FreightSummary.tsx`
Tabla de asignación por productor con porcentaje de carga y costos unitarios en formato `es-AR`.

---

## 7. Supuestos y Límites del MVP

1. **Estimación Paramétrica:** Es un modelo de apoyo a la decisión para la demo de la Ideathon. No constituye una cotización formal de transporte ni contrato vinculante.
2. **Sin Optimización de Rutas GPS:** No se consultan APIs de ruteo vehicular pesadas ni de pago para asegurar funcionamiento autónomo y confiable durante la presentación.
