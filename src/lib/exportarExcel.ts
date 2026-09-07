import ExcelJS from 'exceljs';
import { formatoCantidadAplicacion } from './aplicaciones';
import type { Aplicacion, CompraInsumo, Cosecha, Jornal, Riego, Venta } from '../types/models';
import { hoyISO } from './fechas';

export interface DatosReporteExcel {
  /** Cambia cómo se calcula el invertido; ver la fila "Invertido" del Resumen. */
  modo: 'ciclo' | 'periodo';
  alcance: string;
  generadoEl: string;
  aplicaciones: Aplicacion[];
  cosechas: Cosecha[];
  riegos: Riego[];
  ventas: Venta[];
  compras: CompraInsumo[];
  jornales: Jornal[];
  nombreLote: (loteId?: string) => string;
}

// Paleta tomada de los tokens de la app (src/index.css), en ARGB.
const ORO = 'FFC88A2E';
const TINTA = 'FF1B2A1F';
const VERDE = 'FF1F4620';
const BANDA = 'FFF7F5EC'; // crema muy claro, para las filas alternas
const LINEA = 'FFDDDAC8';
const GRIS = 'FF7A7A6B';
const POSITIVO_BG = 'FFDCEAD9';
const POSITIVO_TEXTO = 'FF1F4620';
const NEGATIVO_BG = 'FFF6DCD1';
const NEGATIVO_TEXTO = 'FFB4552F';
const AZUL_LINK = 'FF2F6690';

const FORMATO_MONEDA = '"$"#,##0';
const FORMATO_FECHA = 'dd/mm/yyyy';
const FORMATO_PORCENTAJE = '+0%;-0%';

// Filas del bloque de título que va arriba de cada hoja de datos.
const FILA_TITULO = 2;
const FILA_ALCANCE = 3;
const FILA_GENERADO = 4;
const FILA_ENCABEZADO = 6;
const PRIMERA_FILA_DATOS = FILA_ENCABEZADO + 1;

/** Convierte un índice de columna 1-based ("1, 2, 27...") a letra de Excel ("A, B, AA..."). */
function letraColumna(indice: number): string {
  let n = indice;
  let letra = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

function fechaExcel(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

const borde = (argb: string): ExcelJS.Border => ({ style: 'thin', color: { argb } });

interface Encabezado {
  titulo: string;
  ancho: number;
  moneda?: boolean;
  fecha?: boolean;
  numero?: boolean;
  /** Pinta "Pendiente" en rojo y "Sí" en verde: se ve de un vistazo qué falta. */
  estado?: boolean;
  centrado?: boolean;
}

interface OpcionesHoja {
  nombre: string;
  colorPestana: string;
  encabezados: Encabezado[];
  filas: (string | number | Date | null)[][];
  /** Columna 1-based sobre la que va el SUM final. */
  columnaTotal?: number;
  apaisada?: boolean;
}

/**
 * Crea una hoja de datos con su propio bloque de título, encabezado, filas
 * alternadas, autofiltro, fila congelada, configuración de impresión y (si se
 * indica columnaTotal) una fila final con un SUM() real sobre los datos, para
 * que el número no sea un valor pegado desde la app sino uno que Excel
 * recalcula si alguien edita una fila.
 *
 * La hoja se crea aunque venga sin filas, para que nunca falte una pestaña ni
 * se rompa una referencia cruzada del Resumen.
 */
function agregarHoja(workbook: ExcelJS.Workbook, datos: DatosReporteExcel, op: OpcionesHoja) {
  const hoja = workbook.addWorksheet(op.nombre);
  hoja.properties.tabColor = { argb: op.colorPestana };

  // Sin cuadrícula: hace que se lea como un documento y no como una hoja de cálculo.
  hoja.views = [{ state: 'frozen', ySplit: FILA_ENCABEZADO, showGridLines: false }];

  const ultimaColumna = letraColumna(op.encabezados.length);
  op.encabezados.forEach((e, i) => {
    hoja.getColumn(i + 1).width = e.ancho;
  });

  // --- Bloque de título ---
  hoja.getRow(1).height = 8;
  hoja.mergeCells(`A${FILA_TITULO}:${ultimaColumna}${FILA_TITULO}`);
  const celdaTitulo = hoja.getCell(`A${FILA_TITULO}`);
  celdaTitulo.value = op.nombre.toUpperCase();
  celdaTitulo.font = { bold: true, size: 15, color: { argb: VERDE } };
  celdaTitulo.alignment = { vertical: 'middle' };
  hoja.getRow(FILA_TITULO).height = 24;

  hoja.mergeCells(`A${FILA_ALCANCE}:${ultimaColumna}${FILA_ALCANCE}`);
  const celdaAlcance = hoja.getCell(`A${FILA_ALCANCE}`);
  celdaAlcance.value = datos.alcance;
  celdaAlcance.font = { size: 10, color: { argb: TINTA } };

  hoja.mergeCells(`A${FILA_GENERADO}:${ultimaColumna}${FILA_GENERADO}`);
  const celdaGenerado = hoja.getCell(`A${FILA_GENERADO}`);
  const cuantos = op.filas.length;
  celdaGenerado.value = `Generado el ${datos.generadoEl}  ·  ${cuantos} ${cuantos === 1 ? 'registro' : 'registros'}`;
  celdaGenerado.font = { size: 9, italic: true, color: { argb: GRIS } };
  hoja.getRow(5).height = 6;

  const alineacion = (e: Encabezado) => ({
    vertical: 'middle' as const,
    horizontal: (e.moneda || e.numero
      ? 'right'
      : e.centrado || e.estado
        ? 'center'
        : 'left') as 'right' | 'center' | 'left',
    indent: 1,
  });

  // --- Encabezado de la tabla ---
  const filaEncabezado = hoja.getRow(FILA_ENCABEZADO);
  op.encabezados.forEach((e, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = e.titulo;
    celda.font = { bold: true, size: 10, color: { argb: TINTA } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORO } };
    celda.alignment = alineacion(e);
    celda.border = { bottom: borde(TINTA) };
  });
  filaEncabezado.height = 24;

  // --- Filas de datos ---
  op.filas.forEach((filaDatos, indice) => {
    const fila = hoja.getRow(PRIMERA_FILA_DATOS + indice);
    fila.height = 19;
    const esBanda = indice % 2 === 1;
    op.encabezados.forEach((e, i) => {
      const celda = fila.getCell(i + 1);
      celda.value = filaDatos[i];
      if (e.moneda) celda.numFmt = FORMATO_MONEDA;
      if (e.fecha) celda.numFmt = FORMATO_FECHA;
      celda.alignment = alineacion(e);
      celda.border = { bottom: borde(LINEA) };
      if (esBanda) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANDA } };
      if (e.estado) {
        const pendiente = String(filaDatos[i]).toLowerCase().startsWith('pend');
        celda.font = { size: 10, bold: pendiente, color: { argb: pendiente ? NEGATIVO_TEXTO : POSITIVO_TEXTO } };
      } else {
        celda.font = { size: 10, color: { argb: TINTA } };
      }
    });
  });

  const ultimaFilaDatos = PRIMERA_FILA_DATOS + op.filas.length - 1;
  hoja.autoFilter = {
    from: `A${FILA_ENCABEZADO}`,
    to: `${ultimaColumna}${Math.max(ultimaFilaDatos, FILA_ENCABEZADO)}`,
  };

  // --- Fila de total ---
  let refTotal: string | null = null;
  if (op.columnaTotal != null) {
    const letra = letraColumna(op.columnaTotal);
    const fila = hoja.getRow(ultimaFilaDatos + 2);
    fila.height = 22;
    for (let i = 1; i <= op.encabezados.length; i++) {
      const celda = fila.getCell(i);
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: POSITIVO_BG } };
      celda.border = { top: borde(VERDE) };
      celda.alignment = { vertical: 'middle', indent: 1 };
    }
    fila.getCell(1).value = 'TOTAL';
    fila.getCell(1).font = { bold: true, size: 10, color: { argb: VERDE } };
    const celdaTotal = fila.getCell(op.columnaTotal);
    celdaTotal.value =
      op.filas.length > 0 ? { formula: `SUM(${letra}${PRIMERA_FILA_DATOS}:${letra}${ultimaFilaDatos})` } : 0;
    celdaTotal.numFmt = FORMATO_MONEDA;
    celdaTotal.font = { bold: true, size: 11, color: { argb: VERDE } };
    celdaTotal.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    refTotal = `${op.nombre}!${letra}${fila.number}`;
  }

  // --- Impresión: que salga bien en papel para un banco o un auditor ---
  hoja.pageSetup = {
    paperSize: 9, // A4
    orientation: op.apaisada ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    printTitlesRow: `${FILA_ENCABEZADO}:${FILA_ENCABEZADO}`,
  };
  hoja.headerFooter = {
    oddFooter: `&L&8&K7A7A6B AgroData · ${op.nombre}&R&8&K7A7A6B Página &P de &N`,
  };

  return { hoja, refTotal, primeraFilaDatos: PRIMERA_FILA_DATOS };
}

export async function exportarExcel(datos: DatosReporteExcel) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AgroData';
  workbook.created = new Date();

  // La hoja Resumen se crea primero (para que sea la pestaña inicial al abrir el
  // archivo), pero sus valores se completan al final, una vez que existen las
  // referencias a los totales de cada hoja de datos — son fórmulas cruzadas
  // reales, no números pegados desde la app.
  const hojaResumen = workbook.addWorksheet('Resumen');
  hojaResumen.properties.tabColor = { argb: ORO };
  hojaResumen.views = [{ showGridLines: false }];
  hojaResumen.getColumn(1).width = 46;
  hojaResumen.getColumn(2).width = 22;
  hojaResumen.getColumn(3).width = 16;

  hojaResumen.getRow(1).height = 10;
  hojaResumen.mergeCells('A2:C2');
  const marca = hojaResumen.getCell('A2');
  marca.value = 'AGRODATA';
  marca.font = { bold: true, size: 11, color: { argb: ORO } };

  hojaResumen.mergeCells('A3:C3');
  const titulo = hojaResumen.getCell('A3');
  titulo.value = 'Reporte consolidado';
  titulo.font = { bold: true, size: 20, color: { argb: VERDE } };
  hojaResumen.getRow(3).height = 30;

  hojaResumen.mergeCells('A4:C4');
  const alcance = hojaResumen.getCell('A4');
  alcance.value = datos.alcance;
  alcance.font = { size: 12, color: { argb: TINTA } };
  hojaResumen.getRow(4).height = 18;

  hojaResumen.mergeCells('A5:C5');
  const generado = hojaResumen.getCell('A5');
  generado.value = `Generado el ${datos.generadoEl}`;
  generado.font = { size: 9, italic: true, color: { argb: GRIS } };
  hojaResumen.getRow(6).height = 14;

  const rotulo = (texto: string) => {
    const fila = hojaResumen.addRow([texto]);
    hojaResumen.mergeCells(`A${fila.number}:C${fila.number}`);
    fila.getCell(1).font = { bold: true, size: 9, color: { argb: GRIS } };
    fila.getCell(1).border = { bottom: borde(LINEA) };
    fila.height = 18;
  };

  rotulo('RESULTADO');
  const filaVendido = hojaResumen.addRow(['Vendido']);
  const filaInvertido = hojaResumen.addRow([
    datos.modo === 'ciclo' ? 'Invertido (insumos aplicados + jornales del lote)' : 'Invertido (compras + jornales)',
  ]);
  const filaBalance = hojaResumen.addRow(['Balance']);
  const filaRetorno = hojaResumen.addRow(['% Retorno']);
  [filaVendido, filaInvertido, filaBalance, filaRetorno].forEach((f) => {
    f.height = 26;
    f.getCell(1).font = { size: 11, color: { argb: TINTA } };
    f.getCell(1).alignment = { vertical: 'middle' };
    f.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
    f.getCell(1).border = { bottom: borde(LINEA) };
    f.getCell(2).border = { bottom: borde(LINEA) };
  });
  filaBalance.getCell(1).font = { bold: true, size: 12, color: { argb: VERDE } };
  filaRetorno.getCell(1).font = { bold: true, size: 12, color: { argb: VERDE } };

  // Deja escrito por qué la hoja que NO se sumó no se sumó, para que nadie la
  // sume a mano y termine contando el mismo insumo dos veces.
  const filaNota = hojaResumen.addRow([]);
  hojaResumen.mergeCells(`A${filaNota.number}:C${filaNota.number}`);
  filaNota.getCell(1).value =
    datos.modo === 'ciclo'
      ? 'Las compras no se suman acá: no son de un lote puntual. El costo del insumo llega a este lote por la hoja Aplicaciones.'
      : 'La hoja Aplicaciones no se suma acá: muestra en qué lote se usó cada insumo, pero esa plata ya está contada en Compras.';
  filaNota.getCell(1).font = { italic: true, size: 9, color: { argb: GRIS } };
  filaNota.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  filaNota.height = 28;

  hojaResumen.addRow([]);
  rotulo('QUÉ TRAE ESTE ARCHIVO');
  const filaEncIndice = hojaResumen.addRow(['Hoja', 'Registros', 'Total']);
  filaEncIndice.height = 20;
  [1, 2, 3].forEach((c) => {
    const celda = filaEncIndice.getCell(c);
    celda.font = { bold: true, size: 10, color: { argb: TINTA } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORO } };
    celda.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'right', indent: 1 };
  });

  const agregarAlIndice = (nombre: string, cuantos: number, ref: string | null) => {
    const fila = hojaResumen.addRow([nombre, cuantos]);
    fila.height = 18;
    [1, 2, 3].forEach((c) => {
      const celda = fila.getCell(c);
      celda.font = { size: 10, color: { argb: TINTA } };
      celda.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'right', indent: 1 };
      celda.border = { bottom: borde(LINEA) };
    });
    if (ref) {
      const celda = fila.getCell(3);
      celda.value = { formula: ref };
      celda.numFmt = FORMATO_MONEDA;
    } else {
      fila.getCell(3).value = '—';
    }
  };

  // --- Aplicaciones ---
  const { refTotal: totalAplicaciones } = agregarHoja(workbook, datos, {
    nombre: 'Aplicaciones',
    colorPestana: 'FF4A7C3F',
    apaisada: true,
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Producto', ancho: 26 },
      { titulo: 'Cantidad', ancho: 16 },
      { titulo: 'Dosis', ancho: 18 },
      { titulo: 'Responsable', ancho: 16 },
      { titulo: 'Costo estimado', ancho: 17, moneda: true },
      { titulo: 'Lote', ancho: 26 },
    ],
    filas: datos.aplicaciones.map((a) => [
      fechaExcel(a.fecha),
      a.producto,
      formatoCantidadAplicacion(a),
      a.dosis ?? '',
      a.responsable,
      a.costoEstimado ?? 0,
      datos.nombreLote(a.loteId),
    ]),
    columnaTotal: 6,
  });

  // --- Cosechas (sin total monetario: la cantidad es texto libre, ej. "35 cajas") ---
  agregarHoja(workbook, datos, {
    nombre: 'Cosechas',
    colorPestana: 'FF2F6690',
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Cantidad', ancho: 28 },
      { titulo: 'Calidad', ancho: 16, centrado: true },
      { titulo: 'Lote', ancho: 26 },
    ],
    filas: datos.cosechas.map((c) => [fechaExcel(c.fecha), c.cantidad, c.calidad ?? '', datos.nombreLote(c.loteId)]),
  });

  // --- Riegos ---
  agregarHoja(workbook, datos, {
    nombre: 'Riegos',
    colorPestana: 'FF1F8A7A',
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Duración', ancho: 18 },
      { titulo: 'Método', ancho: 20 },
      { titulo: 'Responsable', ancho: 16 },
      { titulo: 'Lote', ancho: 26 },
    ],
    filas: datos.riegos.map((r) => [
      fechaExcel(r.fecha),
      r.duracion ?? '',
      r.metodo ?? '',
      r.responsable,
      datos.nombreLote(r.loteId),
    ]),
  });

  // --- Ventas ---
  const { refTotal: totalVentas } = agregarHoja(workbook, datos, {
    nombre: 'Ventas',
    colorPestana: 'FF1F4620',
    apaisada: true,
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Cantidad', ancho: 28 },
      { titulo: 'Precio', ancho: 16, moneda: true },
      { titulo: 'Comprador', ancho: 24 },
      { titulo: 'Cobrado', ancho: 13, estado: true },
      { titulo: 'Lote', ancho: 26 },
    ],
    filas: datos.ventas.map((v) => [
      fechaExcel(v.fecha),
      v.cantidad,
      v.precio,
      v.comprador ?? '',
      v.cobrado ? 'Sí' : 'Pendiente',
      datos.nombreLote(v.loteId),
    ]),
    columnaTotal: 3,
  });

  // --- Compras (con link a la foto de factura) ---
  const { refTotal: totalCompras, primeraFilaDatos: filaCompra } = agregarHoja(workbook, datos, {
    nombre: 'Compras',
    colorPestana: 'FFB4552F',
    apaisada: true,
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Producto', ancho: 26 },
      { titulo: 'Cantidad', ancho: 12, numero: true },
      { titulo: 'Costo', ancho: 16, moneda: true },
      { titulo: 'Proveedor', ancho: 24 },
      { titulo: 'Compró', ancho: 15 },
      { titulo: 'Factura', ancho: 14, centrado: true },
    ],
    filas: datos.compras.map((c) => [
      fechaExcel(c.fecha),
      c.producto,
      c.cantidad ?? '',
      c.costo,
      c.proveedor ?? '',
      c.personaQueCompro,
      '',
    ]),
    columnaTotal: 4,
  });

  const hojaCompras = workbook.getWorksheet('Compras')!;
  datos.compras.forEach((c, i) => {
    if (!c.fotoFacturaUrl) return;
    const celda = hojaCompras.getRow(filaCompra + i).getCell(7);
    celda.value = { text: 'Ver foto', hyperlink: c.fotoFacturaUrl };
    celda.font = { size: 10, color: { argb: AZUL_LINK }, underline: true };
  });

  // Una hoja Compras vacía en un reporte de ciclo parece un dato faltante, no
  // una decisión. Se deja dicho por qué está vacía.
  if (datos.modo === 'ciclo') {
    const nota = hojaCompras.getRow(PRIMERA_FILA_DATOS + 3);
    hojaCompras.mergeCells(`A${nota.number}:G${nota.number + 3}`);
    nota.getCell(1).value =
      'Esta hoja está vacía a propósito.\n\n' +
      'Una compra de insumo no es de un lote puntual: un mismo bulto se reparte entre varios, así que cargársela ' +
      'entera a este lote daría un costo falso. La compra entra al inventario, y el costo llega al lote por la hoja ' +
      'Aplicaciones, donde cada aplicación toma su parte al precio que tenía el insumo ese día.';
    nota.getCell(1).font = { italic: true, size: 10, color: { argb: GRIS } };
    nota.getCell(1).alignment = { wrapText: true, vertical: 'top', horizontal: 'left', indent: 1 };
  }

  // --- Jornales ---
  const { refTotal: totalJornales } = agregarHoja(workbook, datos, {
    nombre: 'Jornales',
    colorPestana: 'FF7A5C2E',
    apaisada: true,
    encabezados: [
      { titulo: 'Fecha', ancho: 13, fecha: true },
      { titulo: 'Trabajador', ancho: 24 },
      { titulo: 'Labor', ancho: 22 },
      { titulo: 'Cantidad', ancho: 11, numero: true },
      { titulo: 'Unidad', ancho: 11, centrado: true },
      { titulo: 'Tarifa', ancho: 14, moneda: true },
      { titulo: 'Valor', ancho: 16, moneda: true },
      { titulo: 'Pagado', ancho: 13, estado: true },
      { titulo: 'Quién pagó', ancho: 15 },
      { titulo: 'Lote', ancho: 26 },
    ],
    filas: datos.jornales.map((j) => [
      fechaExcel(j.fecha),
      j.trabajador,
      j.labor ?? '',
      j.cantidad,
      j.unidad === 'dia' ? 'día' : 'hora',
      j.tarifa,
      j.valor,
      j.pagado ? 'Sí' : 'Pendiente',
      j.quienPago,
      datos.nombreLote(j.loteId),
    ]),
    columnaTotal: 7,
  });

  // --- Índice, ya con todas las hojas creadas y sus totales referenciables ---
  agregarAlIndice('Aplicaciones', datos.aplicaciones.length, totalAplicaciones);
  agregarAlIndice('Cosechas', datos.cosechas.length, null);
  agregarAlIndice('Riegos', datos.riegos.length, null);
  agregarAlIndice('Ventas', datos.ventas.length, totalVentas);
  agregarAlIndice('Compras', datos.compras.length, totalCompras);
  agregarAlIndice('Jornales', datos.jornales.length, totalJornales);

  // --- Completar el Resumen con fórmulas cruzadas a los totales de cada hoja ---
  const celdaVendido = filaVendido.getCell(2);
  celdaVendido.value = { formula: totalVentas! };
  celdaVendido.numFmt = FORMATO_MONEDA;
  celdaVendido.font = { size: 13, color: { argb: TINTA } };

  // Por ciclo el gasto del lote es lo que se le aplicó; por período es la plata
  // que salió (compras). Sumar ambos contaría el mismo insumo dos veces, porque
  // la aplicación consume justo lo que la compra metió al inventario.
  const celdaInvertido = filaInvertido.getCell(2);
  celdaInvertido.value = {
    formula: datos.modo === 'ciclo' ? `${totalAplicaciones}+${totalJornales}` : `${totalCompras}+${totalJornales}`,
  };
  celdaInvertido.numFmt = FORMATO_MONEDA;
  celdaInvertido.font = { size: 13, color: { argb: TINTA } };

  const celdaBalance = filaBalance.getCell(2);
  celdaBalance.value = { formula: `B${filaVendido.number}-B${filaInvertido.number}` };
  celdaBalance.numFmt = FORMATO_MONEDA;
  celdaBalance.font = { bold: true, size: 15 };

  const celdaRetorno = filaRetorno.getCell(2);
  celdaRetorno.value = {
    formula: `IF(B${filaInvertido.number}=0,"",B${filaBalance.number}/B${filaInvertido.number})`,
  };
  celdaRetorno.numFmt = FORMATO_PORCENTAJE;
  celdaRetorno.font = { bold: true, size: 15 };

  hojaResumen.addConditionalFormatting({
    ref: `B${filaBalance.number}:B${filaRetorno.number}`,
    rules: [
      {
        type: 'expression',
        formulae: [`$B${filaBalance.number}<0`],
        priority: 1,
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: NEGATIVO_BG } },
          font: { bold: true, color: { argb: NEGATIVO_TEXTO } },
        },
      },
      {
        type: 'expression',
        formulae: [`$B${filaBalance.number}>=0`],
        priority: 2,
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: POSITIVO_BG } },
          font: { bold: true, color: { argb: POSITIVO_TEXTO } },
        },
      },
    ],
  });

  hojaResumen.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.6, right: 0.6, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agrodata-reporte-${hoyISO()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
