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
  separación de todo por ciclo, y a futuro posible integración/exportación a Excel.
- **Riego/lluvia**: descartado por ahora, no se incluye en esta versión.

## Decisión de modelo: qué es un "ciclo"

Guayaba (y frutales en general) es un cultivo **perenne**: el árbol no se resiembra cada cosecha,
produce varias veces al año. Por eso un "ciclo" acá **no es el ciclo biológico de la planta**, es
un **período contable que el usuario abre y cierra a su criterio** (ej. "Ciclo 2026-1"), usado para
agrupar aplicaciones, jornales, compras y ventas de un lote y así poder calcular cuánto se ganó en
esa ventana. Un lote puede tener varias ventas dentro del mismo ciclo (no una única cosecha final).
Esta definición es la base de todo el modelo de datos.

## Decisión de alcance: sin inventario de insumos

No se va a llevar stock/bodega de insumos en esta versión (cuánto queda de cada producto). Cada
compra se registra como gasto asociado a un lote/ciclo, y cada aplicación se registra por
trazabilidad (qué se aplicó, cuánto, cuándo) — sin descontar de un inventario. Es la diferencia
entre un sistema simple que resuelve el problema real (saber cuánto gastaron y qué aplicaron) y uno
complejo (control de bodega) que hoy no hace falta. Se puede agregar más adelante si surge la
necesidad.

---

## Estructura general de la app (navegación)

1. **Pantalla de inicio**: listado de lotes (agrupados por finca).
2. **Entrar a un lote**: se ve su info general (finca, tamaño/área, cantidad de árboles o plantas)
   y se selecciona el **ciclo activo** (o uno histórico, para consulta).
3. **Dentro del lote + ciclo seleccionado**: acciones rápidas predeterminadas —
   registrar aplicación de insumo/químico, registrar cosecha, registrar venta, registrar jornal de
   ese lote.
4. Aparte, un **módulo de Finanzas** con las mismas compras/pagos pero vistos de forma
   centralizada (todas las compras de insumos juntas, todos los pagos de jornales juntos), útil
   para revisar y auditar sin tener que entrar lote por lote.
5. Y un **Panel Administrativo** con gráficas, rentabilidad por lote y búsqueda global.

Esto da dos formas de llegar al mismo dato: **por lote** (mientras estás en el campo, rápido) y
**por módulo financiero** (para revisar/auditar todo junto).

---

## Épica 1 — Fincas y Lotes (datos base)

**HU-1.1** Como usuario, quiero registrar una finca (nombre, ubicación) para agrupar los lotes que
le pertenecen.
- Criterios: CRUD; nombre obligatorio; listado de fincas.

**HU-1.2** Como usuario, quiero registrar un lote dentro de una finca (o suelto, sin finca),
indicando cultivo actual, **tamaño/área** y **cantidad total de árboles o plantas sembradas**, para
tener cada lote identificado con su información real.
- Criterios: CRUD completo; lote puede no tener finca asociada; campos cultivo, área (con unidad,
  ej. hectáreas), N° de árboles/plantas.

**HU-1.3** Como usuario, al abrir la app quiero ver primero el listado de todos mis lotes agrupados
por finca, para elegir con cuál quiero trabajar.
- Criterios: pantalla de inicio = listado de lotes; agrupados por finca + sección de lotes sueltos;
  acceso directo a cada lote desde ahí.

---

## Épica 2 — Ciclos por Lote

**HU-2.1** Como usuario, quiero crear un ciclo dentro de un lote (con fecha de inicio, nombre o
identificador), para agrupar bajo ese ciclo todo lo que pase en el lote durante ese período.
- Criterios: un lote puede tener varios ciclos a lo largo del tiempo (históricos); el usuario decide
  cuándo abre y cierra un ciclo, no hay fecha de cierre automática.

**HU-2.2** Como usuario, al entrar a un lote quiero que se me muestre su **ciclo activo** primero
(y poder cambiar a un ciclo histórico si quiero consultarlo), para no confundir datos de distintos
períodos.
- Criterios: un lote tiene como máximo un ciclo activo a la vez; selector de ciclo dentro del lote.

**HU-2.3** Como usuario, quiero ver dentro de un ciclo un resumen de: tamaño del lote, árboles/
plantas, total aplicado, total gastado, total cosechado, total vendido y balance, para tener el
panorama completo de ese lote en ese período sin salir de la pantalla.

---

## Épica 3 — Módulo de Rastreo: Aplicaciones

**HU-3.1** Como usuario, quiero registrar desde el lote (dentro del ciclo activo) una aplicación de
insumo o químico — producto, cantidad, fecha, quién la aplicó — para no depender de la memoria de
quien la hizo.
- Criterios: acción rápida desde la pantalla del lote; queda vinculada al lote + ciclo activo.

**HU-3.2** Como usuario, quiero ver el historial de aplicaciones de un lote ordenado por fecha,
para reconstruir la secuencia real de manejo del cultivo.
- Criterios: listado dentro del lote, filtrable por fecha y por producto.

*(Futuro / no bloqueante para el MVP)* **HU-3.3** Días de carencia por producto y alerta si una
cosecha cae antes de cumplirse el plazo.

---

## Épica 4 — Módulo de Rastreo: Cosecha y Venta

**HU-4.1** Como usuario, quiero registrar una cosecha desde el lote (dentro del ciclo activo) —
fecha, cantidad, calidad/selección (ej. selecta vs. no selecta) — para saber cuánto se produjo y de
qué calidad.

**HU-4.2** Como usuario, quiero registrar una venta desde el lote — fecha, cantidad vendida (cajas),
precio, comprador, si ya se cobró — para saber a cuánto se vendió y no depender de la memoria al
momento de liquidar.
- Criterios: un ciclo puede tener varias ventas (no es una cosecha única al final).

---

## Épica 5 — Módulo de Finanzas: Compras de Insumos

**HU-5.1** Como usuario, quiero registrar una compra de insumo — qué producto, costo, fecha,
proveedor/dónde se compró — asociada a un lote y ciclo, para tener el costo real de cada insumo.

**HU-5.2** Como usuario, quiero adjuntar una foto de la factura a cada compra, para tener respaldo
documental igual al que mostraron en el crédito anterior.
- Criterios: carga de imagen desde cámara o galería; visible en el detalle de la compra.

**HU-5.3** Como usuario, quiero ver todas las compras de insumos en un solo listado (módulo
Finanzas), con buscador y filtros por fecha, lote y producto, para revisar o auditar sin entrar
lote por lote.

---

## Épica 6 — Módulo de Finanzas: Pagos de Jornales

**HU-6.1** Como usuario, quiero registrar el pago de un jornal — nombre de la persona, fecha, valor
pagado, labor realizada — asociado a un lote y ciclo, para no perder el registro de la mano de obra.
- Criterios: registrable tanto desde el lote (acción rápida) como desde el módulo Finanzas; estado
  pagado/pendiente.

**HU-6.2** Como usuario, quiero ver todos los pagos de jornales en un solo listado, con buscador y
filtros por trabajador, lote y rango de fechas, para revisar cuánto se le ha pagado a cada persona.

---

## Épica 7 — Panel Administrativo / Dashboard

**HU-7.1** Como usuario, quiero un panel con gráficas dinámicas de gastos vs. ventas por lote y por
ciclo, para ver de un vistazo si estoy ganando o perdiendo dinero.

**HU-7.2** Como usuario, quiero ver la **rentabilidad de cada lote** (total vendido − total
invertido en insumos y jornales, y el % de retorno), para saber qué lotes me convienen más y dónde
estoy perdiendo plata.
- Esta es la historia de mayor valor: hoy Freddy no puede calcular esto y es la razón principal del
  proyecto.

**HU-7.3** Como usuario, quiero buscar y filtrar todos los registros (cosechas, ventas, pagos,
compras, aplicaciones) por lote, finca, ciclo, fecha o persona, desde un solo lugar, para encontrar
cualquier dato rápido sin recorrer lote por lote.

**HU-7.4** Como usuario, quiero una vista consolidada exportable/imprimible con todos los respaldos
(facturas, pagos, aplicaciones) de un ciclo o período, para presentarla en una solicitud de crédito
o ante un auditor.

**HU-7.5** *(Futuro)* Como usuario, quiero exportar los datos a Excel, para cruzarlos o respaldarlos
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
| **Must (MVP)** | 1 (Fincas/Lotes), 2 (Ciclos), 3 (Aplicaciones), 4 (Cosecha/Venta), 5 (Compras+Factura), 6 (Jornales), 8 (Acceso) |
| **Should** | 7.1-7.3 (Dashboard, rentabilidad, búsqueda global) |
| **Could** | 7.4 (Vista para crédito/auditor) |
| **Won't (por ahora)** | 3.3 (alertas de carencia), 7.5 (Excel), riego/lluvia |

El balance por ciclo (HU-2.3 / HU-7.2) y el respaldo de facturas con foto (HU-5.2) son los dos
puntos que más valor le dan al proyecto: hoy no saben cuánto ganan ni tienen cómo respaldar un
crédito. Todo el resto del sistema existe para sostener esos dos números.

## Recomendaciones para más adelante (no MVP, pero vale tenerlas en mente)

- **Duplicar aplicación en varios lotes el mismo día**: en el campo es común aplicar el mismo
  producto en varios lotes seguidos — una acción de "aplicar a estos 3 lotes" ahorraría bastante
  tiempo de carga frente a repetir el formulario 3 veces.
- **Trazabilidad de quién registró cada dato**: con 2 usuarios ayuda a saber quién cargó qué,
  útil si hay dudas sobre un registro.
- **Cierre de ciclo con recordatorio**: avisar si un ciclo lleva mucho tiempo abierto sin ventas
  registradas, para que no se queden ciclos "olvidados" sin cerrar.
