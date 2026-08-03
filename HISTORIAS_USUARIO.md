# Historias de Usuario — Proyecto Freddy Reyes (AgroData)

Sistema de gestión agrícola para finca(s) propias. Reemplaza el registro en papel por un sistema
digital con trazabilidad de aplicaciones, costos, cosechas y finanzas, usable en campo (sin señal)
y en PC.

## Contexto recopilado en reunión

- **Fincas y lotes**: La Vega (3 lotes), El Doctor (3 lotes), una tercera finca (3 lotes), y 2 lotes
  sueltos sin finca asignada. Total ≈ 11 lotes a través de 3+ fincas.
- **Usuarios**: 2 personas en el sistema (dueño + encargado, ej. Emerson).
- **Problema actual**: todo se lleva de memoria o en papel. Nadie recuerda con certeza qué se
  aplicó, cuándo, ni en qué lote — se interrumpen las secuencias de aplicación por falta de
  información. Al vender no saben a cuánto vender ni cuánto ganaron realmente.
- **Motivación fuerte**: solicitar créditos agropecuarios con datos reales y respaldo de facturas.
  Un crédito anterior lo sacaron mostrando facturas en papel ante un auditor — el sistema los
  calificaría de 1 a 10 según qué tan organizados estén los registros ("fin agro").
- **Necesitan**: buscadores con filtros (jornales, aplicaciones, facturas), fotos de factura,
  separación de todo por ciclo de cosecha, y a futuro posible integración/exportación a Excel.

---

## Épica 1 — Fincas y Lotes

**HU-1.1** Como usuario administrador, quiero registrar una finca (nombre, ubicación) para agrupar
los lotes que le pertenecen.
- Criterios: crear/editar/eliminar finca; nombre obligatorio; lista de fincas visible.

**HU-1.2** Como usuario administrador, quiero registrar un lote dentro de una finca (o sin finca,
para los lotes sueltos), indicando cultivo actual y cantidad de árboles, para tener identificado
cada lote individualmente.
- Criterios: CRUD completo; lote puede quedar sin finca asociada; campo cultivo y N° de árboles.

**HU-1.3** Como usuario, quiero ver un listado/mapa simple de todos mis lotes agrupados por finca,
para recorrerlos y saber cuáles tengo y dónde están.
- Criterios: vista agrupada por finca + sección aparte para lotes sueltos.

---

## Épica 2 — Aplicación de Productos (fertilizantes/agroquímicos)

**HU-2.1** Como usuario, quiero registrar una aplicación de producto en un lote (producto, dosis,
fecha, cantidad, costo) para no depender de la memoria de quien la hizo.
- Criterios: selección de lote, fecha, producto, dosis, cantidad aplicada, costo; queda vinculada
  al ciclo de cosecha activo del lote.

**HU-2.2** Como usuario, quiero ver el historial de aplicaciones de un lote ordenado por fecha,
para reconstruir la secuencia real de manejo del cultivo.
- Criterios: listado filtrable por lote, por rango de fechas y por producto.

**HU-2.3** Como usuario, quiero registrar quién aplicó el producto, para saber a quién preguntar
si hay dudas y dejar de depender de "preguntarle a Emerson".
- Criterios: campo de responsable/aplicador en cada registro.

*(Futuro / no bloqueante para el MVP)* **HU-2.4** Días de carencia por producto y alerta si una
cosecha cae antes de cumplirse el plazo.

---

## Épica 3 — Riego y Lluvia

**HU-3.1** Como usuario, quiero registrar la cantidad de lluvia caída por finca/lote y fecha, para
tener ese dato disponible junto con las aplicaciones y cosechas.
- Criterios: registro simple fecha + mm de lluvia (o cualitativo si no hay pluviómetro) por finca.

**HU-3.2** *(Deseable, no crítico)* Como usuario, quiero registrar riegos realizados (fecha, lote,
duración/cantidad), para llevar control de esa labor igual que las aplicaciones.

---

## Épica 4 — Finanzas: Gastos y Facturas

**HU-4.1** Como usuario, quiero registrar un gasto (fecha, valor, persona que compró, insumo
comprado, proveedor/dónde se compró) para tener el costo real de cada insumo.
- Criterios: todos los campos mencionados; asociado a un lote/ciclo cuando aplique.

**HU-4.2** Como usuario, quiero adjuntar una foto de la factura a cada gasto, para tener respaldo
documental igual al que mostraron en el crédito anterior.
- Criterios: carga de imagen desde cámara o galería; visible al abrir el detalle del gasto.

**HU-4.3** Como usuario, quiero ver un listado de gastos con buscador y filtros (por fecha, por
lote, por tipo de insumo), para encontrar cualquier factura rápido.

---

## Épica 5 — Finanzas: Pagos a Trabajadores (Jornales)

**HU-5.1** Como usuario, quiero registrar el pago a un trabajador (persona, labor realizada,
jornales/horas, valor, quién pagó, quién recibió, fecha) para no perder el registro de la mano de
obra.
- Criterios: todos los campos; estado pagado/pendiente.

**HU-5.2** Como usuario, quiero filtrar y buscar pagos de jornales por trabajador, por lote y por
rango de fechas, para revisar cuánto se le ha pagado a cada persona.

---

## Épica 6 — Cosechas y Ciclos

**HU-6.1** Como usuario, quiero crear un ciclo de cosecha para un lote (definido por mí, con fecha
de inicio), para que todos los gastos, aplicaciones y jornales de ese período queden agrupados
bajo ese ciclo.
- Criterios: un lote puede tener ciclos históricos; el usuario decide cuándo abre/cierra un ciclo,
  no es automático por fecha de calendario.

**HU-6.2** Como usuario, quiero registrar la cosecha de un ciclo (cantidad, selección/calidad —
ej. guayaba selecta vs. no selecta, cajas), para saber cuánto se produjo y de qué calidad.

**HU-6.3** Como usuario, quiero registrar la venta de la cosecha (cajas vendidas, precio, comprador,
fecha, si ya se cobró), para saber a cuánto se vendió y no depender de la memoria al momento de
liquidar.

**HU-6.4** Como usuario, quiero ver el balance de un ciclo (total gastado en insumos + jornales vs.
total vendido) para saber cuánto gané y cuánto sobró en cada cosecha.
- Este es el número que hoy no pueden calcular — es el corazón del sistema.

---

## Épica 7 — Panel Admin / Dashboard General

**HU-7.1** Como usuario administrador, quiero un panel general con los datos separados por ciclo de
cosecha seleccionado, para revisar pagos, gastos de insumos, riegos y cosechas de ese ciclo
específico.
- Criterios: selector de ciclo arriba; todas las secciones (gastos, jornales, aplicaciones, riego,
  cosecha/venta) filtradas por ese ciclo.

**HU-7.2** Como usuario, quiero buscadores con filtros combinados (por lote, por finca, por fecha,
por tipo de registro) en jornales, aplicaciones y facturas, para encontrar información rápido sin
recorrer todo.

**HU-7.3** Como usuario, quiero una vista consolidada exportable/imprimible con todos los
respaldos (facturas, pagos, aplicaciones) de un ciclo o período, para presentarla en una solicitud
de crédito o ante un auditor.
- Esta historia es la de mayor valor de negocio: es la razón principal del proyecto.

**HU-7.4** *(Futuro)* Como usuario, quiero exportar los datos a Excel, para cruzarlos o respaldarlos
fuera del sistema.

---

## Épica 8 — Acceso y Usuarios

**HU-8.1** Como administrador, quiero que solo los 2 usuarios del sistema (dueño y encargado)
puedan iniciar sesión y cargar información, para mantener el control de quién registra qué.
- Criterios: login con Firebase Auth; sin registro público abierto (usuarios creados a mano).

---

## Priorización sugerida (MVP primero)

| Prioridad | Épicas |
|---|---|
| **Must (MVP)** | 1 (Fincas/Lotes), 2.1-2.3 (Aplicaciones), 4 (Gastos+Facturas), 5 (Jornales), 6 (Ciclos/Cosecha/Venta/Balance), 8 (Acceso) |
| **Should** | 7.1-7.2 (Dashboard filtrado y buscadores) |
| **Could** | 3 (Lluvia/Riego), 7.3 (Vista para crédito/auditor) |
| **Won't (por ahora)** | 2.4 (alertas de carencia), 7.4 (Excel) |

El balance por ciclo (HU-6.4) y el respaldo de facturas con foto (HU-4.2) son los dos puntos que
más valor le dan al proyecto según lo que contó Freddy: hoy no saben cuánto ganan ni tienen cómo
respaldar un crédito. Todo el resto del sistema existe para sostener esos dos números.
