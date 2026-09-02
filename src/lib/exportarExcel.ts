import ExcelJS from 'exceljs';
import { formatoCantidadAplicacion } from './aplicaciones';
import type { Aplicacion, CompraInsumo, Cosecha, Jornal, Riego, Venta } from '../types/models';

export interface DatosReporteExcel {
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

const COLOR_ENCABEZADO = 'FFC88A2E'; // var(--gold) en ARGB
const COLOR_TEXTO_ENCABEZADO = 'FF1B2A1F'; // var(--gold-ink)
const COLOR_POSITIVO_BG = 'FFDCEAD9';
const COLOR_POSITIVO_TEXTO = 'FF1F4620';
const COLOR_NEGATIVO_BG = 'FFF6DCD1';
const COLOR_NEGATIVO_TEXTO = 'FFB4552F';
const FORMATO_MONEDA = '"$"#,##0';
const FORMATO_FECHA = 'dd/mm/yyyy';
const FORMATO_PORCENTAJE = '+0%;-0%';

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

function estiloEncabezado(fila: ExcelJS.Row) {
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: COLOR_TEXTO_ENCABEZADO } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
    celda.alignment = { vertical: 'middle' };
  });
  fila.height = 20;
}

function ajustarAnchos(hoja: ExcelJS.Worksheet, anchos: number[]) {
  anchos.forEach((ancho, i) => {
    hoja.getColumn(i + 1).width = ancho;
  });
}

interface Encabezado {
  titulo: string;
  ancho: number;
  moneda?: boolean;
  fecha?: boolean;
}

/**
 * Crea una hoja con encabezado, autofiltro, fila congelada y (si se indica `columnaTotal`) una
 * fila final en negrita con un SUM() real sobre los datos — para que el número no sea un valor que
 * la app "dice que es", sino algo que la misma planilla recalcula. Siempre crea la hoja, incluso
 * sin filas, para que nunca falte una pestaña ni se rompa una referencia cruzada del Resumen.
 */
function agregarHoja(
  workbook: ExcelJS.Workbook,
  nombre: string,
  encabezados: Encabezado[],
  filas: (string | number | Date | null)[][],
  columnaTotal?: number,
): { hoja: ExcelJS.Worksheet; refTotal: string | null } {
  const hoja = workbook.addWorksheet(nombre);
  const filaEncabezado = hoja.addRow(encabezados.map((e) => e.titulo));
  estiloEncabezado(filaEncabezado);
  ajustarAnchos(hoja, encabezados.map((e) => e.ancho));
  hoja.views = [{ state: 'frozen', ySplit: 1 }];

  filas.forEach((filaDatos) => {
    const filaExcel = hoja.addRow(filaDatos);
    encabezados.forEach((e, i) => {
      if (e.moneda) filaExcel.getCell(i + 1).numFmt = FORMATO_MONEDA;
      if (e.fecha) filaExcel.getCell(i + 1).numFmt = FORMATO_FECHA;
    });
  });

  const ultimaColumna = letraColumna(encabezados.length);
  hoja.autoFilter = { from: 'A1', to: `${ultimaColumna}1` };

  let refTotal: string | null = null;
  if (columnaTotal != null) {
    const letra = letraColumna(columnaTotal);
    const filaTotalNum = filas.length + 2; // fila 1 = encabezado, datos desde la 2
    const filaTotal = hoja.addRow([]);
    filaTotal.getCell(1).value = 'Total';
    filaTotal.getCell(1).font = { bold: true };
    const celdaTotal = filaTotal.getCell(columnaTotal);
    celdaTotal.value = filas.length > 0 ? { formula: `SUM(${letra}2:${letra}${filaTotalNum - 1})` } : 0;
    celdaTotal.numFmt = FORMATO_MONEDA;
    celdaTotal.font = { bold: true };
    celdaTotal.border = { top: { style: 'thin', color: { argb: 'FF999999' } } };
    refTotal = `${nombre}!${letra}${filaTotalNum}`;
  }

  return { hoja, refTotal };
}

export async function exportarExcel(datos: DatosReporteExcel) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AgroData';
  workbook.created = new Date();

  // La hoja Resumen se crea primero (para que sea la pestaña inicial al abrir el archivo), pero
  // sus valores se completan al final, una vez que existen las referencias a los totales de cada
  // hoja de datos — son fórmulas cruzadas reales, no números pegados desde la app.
  const hojaResumen = workbook.addWorksheet('Resumen');
  hojaResumen.addRow(['AgroData — Reporte consolidado']);
  hojaResumen.getRow(1).font = { bold: true, size: 14 };
  hojaResumen.addRow([datos.alcance]);
  hojaResumen.addRow([`Generado el ${datos.generadoEl}`]);
  hojaResumen.addRow([]);
  const filaEncabezadoResumen = hojaResumen.addRow(['Concepto', 'Valor']);
  estiloEncabezado(filaEncabezadoResumen);
  const filaVendido = hojaResumen.addRow(['Vendido']);
  const filaInvertido = hojaResumen.addRow(['Invertido (insumos + compras + jornales)']);
  const filaBalance = hojaResumen.addRow(['Balance']);
  const filaRetorno = hojaResumen.addRow(['% Retorno']);
  [filaVendido, filaInvertido, filaBalance, filaRetorno].forEach((f) => {
    f.getCell(1).font = { bold: true };
  });
  ajustarAnchos(hojaResumen, [34, 20]);

  // --- Aplicaciones ---
  const { refTotal: totalAplicaciones } = agregarHoja(
    workbook,
    'Aplicaciones',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Producto', ancho: 24 },
      { titulo: 'Cantidad', ancho: 16 },
      { titulo: 'Dosis', ancho: 18 },
      { titulo: 'Responsable', ancho: 14 },
      { titulo: 'Costo estimado', ancho: 16, moneda: true },
      { titulo: 'Lote', ancho: 22 },
    ],
    datos.aplicaciones.map((a) => [
      fechaExcel(a.fecha),
      a.producto,
      formatoCantidadAplicacion(a),
      a.dosis ?? '',
      a.responsable,
      a.costoEstimado ?? 0,
      datos.nombreLote(a.loteId),
    ]),
    6,
  );

  // --- Cosechas (sin total monetario: la cantidad es texto libre, ej. "35 cajas") ---
  agregarHoja(
    workbook,
    'Cosechas',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Cantidad', ancho: 16 },
      { titulo: 'Calidad', ancho: 16 },
      { titulo: 'Lote', ancho: 22 },
    ],
    datos.cosechas.map((c) => [fechaExcel(c.fecha), c.cantidad, c.calidad ?? '', datos.nombreLote(c.loteId)]),
  );

  // --- Riegos ---
  agregarHoja(
    workbook,
    'Riegos',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Duración', ancho: 16 },
      { titulo: 'Método', ancho: 16 },
      { titulo: 'Responsable', ancho: 14 },
      { titulo: 'Lote', ancho: 22 },
    ],
    datos.riegos.map((r) => [fechaExcel(r.fecha), r.duracion ?? '', r.metodo ?? '', r.responsable, datos.nombreLote(r.loteId)]),
  );

  // --- Ventas ---
  const { refTotal: totalVentas } = agregarHoja(
    workbook,
    'Ventas',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Cantidad', ancho: 16 },
      { titulo: 'Precio', ancho: 14, moneda: true },
      { titulo: 'Comprador', ancho: 20 },
      { titulo: 'Cobrado', ancho: 10 },
      { titulo: 'Lote', ancho: 22 },
    ],
    datos.ventas.map((v) => [fechaExcel(v.fecha), v.cantidad, v.precio, v.comprador ?? '', v.cobrado ? 'Sí' : 'Pendiente', datos.nombreLote(v.loteId)]),
    3,
  );

  // --- Compras (con link a la foto de factura) ---
  const { refTotal: totalCompras } = agregarHoja(
    workbook,
    'Compras',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Producto', ancho: 22 },
      { titulo: 'Cantidad', ancho: 12 },
      { titulo: 'Costo', ancho: 14, moneda: true },
      { titulo: 'Proveedor', ancho: 20 },
      { titulo: 'Compró', ancho: 14 },
      { titulo: 'Factura', ancho: 14 },
    ],
    datos.compras.map((c) => [fechaExcel(c.fecha), c.producto, c.cantidad ?? '', c.costo, c.proveedor ?? '', c.personaQueCompro, '']),
    4,
  );
  datos.compras.forEach((c, i) => {
    if (!c.fotoFacturaUrl) return;
    const celda = workbook.getWorksheet('Compras')!.getRow(i + 2).getCell(7);
    celda.value = { text: 'Ver foto', hyperlink: c.fotoFacturaUrl };
    celda.font = { color: { argb: 'FF2F6690' }, underline: true };
  });

  // --- Jornales ---
  const { refTotal: totalJornales } = agregarHoja(
    workbook,
    'Jornales',
    [
      { titulo: 'Fecha', ancho: 12, fecha: true },
      { titulo: 'Trabajador', ancho: 20 },
      { titulo: 'Labor', ancho: 18 },
      { titulo: 'Cantidad', ancho: 10 },
      { titulo: 'Unidad', ancho: 10 },
      { titulo: 'Tarifa', ancho: 12, moneda: true },
      { titulo: 'Valor', ancho: 14, moneda: true },
      { titulo: 'Pagado', ancho: 10 },
      { titulo: 'Quién pagó', ancho: 14 },
      { titulo: 'Lote', ancho: 22 },
    ],
    datos.jornales.map((j) => [
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
    7,
  );

  // --- Completar el Resumen con fórmulas cruzadas a los totales de cada hoja ---
  const celdaVendido = filaVendido.getCell(2);
  celdaVendido.value = { formula: totalVentas! };
  celdaVendido.numFmt = FORMATO_MONEDA;

  const celdaInvertido = filaInvertido.getCell(2);
  celdaInvertido.value = { formula: `${totalAplicaciones}+${totalCompras}+${totalJornales}` };
  celdaInvertido.numFmt = FORMATO_MONEDA;

  const celdaBalance = filaBalance.getCell(2);
  celdaBalance.value = { formula: `B${filaVendido.number}-B${filaInvertido.number}` };
  celdaBalance.numFmt = FORMATO_MONEDA;
  celdaBalance.font = { bold: true };

  const celdaRetorno = filaRetorno.getCell(2);
  celdaRetorno.value = { formula: `IF(B${filaInvertido.number}=0,"",B${filaBalance.number}/B${filaInvertido.number})` };
  celdaRetorno.numFmt = FORMATO_PORCENTAJE;
  celdaRetorno.font = { bold: true };

  hojaResumen.addConditionalFormatting({
    ref: `B${filaBalance.number}:B${filaRetorno.number}`,
    rules: [
      {
        type: 'expression',
        formulae: [`$B${filaBalance.number}<0`],
        priority: 1,
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: COLOR_NEGATIVO_BG } }, font: { bold: true, color: { argb: COLOR_NEGATIVO_TEXTO } } },
      },
      {
        type: 'expression',
        formulae: [`$B${filaBalance.number}>=0`],
        priority: 2,
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: COLOR_POSITIVO_BG } }, font: { bold: true, color: { argb: COLOR_POSITIVO_TEXTO } } },
      },
    ],
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agrodata-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
