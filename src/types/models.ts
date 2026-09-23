export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
}

export interface Finca {
  id: string;
  nombre: string;
  ubicacion?: string;
}

export interface Lote {
  id: string;
  fincaId: string | null;
  nombre: string;
  cultivo: string;
  areaHectareas?: number;
  cantidadArboles?: number;
  cicloActivoId?: string | null;
}

export interface Ciclo {
  id: string;
  loteId: string;
  nombre: string;
  fechaInicio: string;
  fechaCierre?: string | null;
  estado: 'abierto' | 'cerrado';
}

export interface Aplicacion {
  id: string;
  loteId: string;
  cicloId: string;
  insumoId?: string; // ausente en registros viejos, de antes del inventario
  producto: string;
  dosis?: string;
  cantidad: string | number; // number para registros nuevos ligados a un insumo; string libre para los viejos
  unidad?: string; // snapshot de la unidad del insumo al momento de aplicar
  costoEstimado?: number; // cantidad * costoUnitario del insumo en ese momento
  fecha: string;
  responsable: string;
  creadoPor: string;
}

export interface Cosecha {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  /** Texto para mostrar ("850 kg", "37 canastillas"); se arma desde los dos campos de abajo. */
  cantidad: string;
  /** Cantidad como número y en qué unidad se midió (ver lib/unidadesCosecha.ts).
   *  Opcionales porque los registros viejos solo tienen el texto. Con esto se
   *  pueden sacar kilos por hectárea y costo por kilo de verdad. */
  cantidadNum?: number;
  unidad?: string;
  calidad?: string;
  creadoPor: string;
}

export interface Riego {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  duracion?: string; // texto libre: "2 horas", "toda la mañana", etc.
  metodo?: string; // ej. "Aspersión", "Goteo", "Manual"
  responsable: string;
  creadoPor: string;
}

export interface Venta {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  /** Precio TOTAL de la venta. Sigue siendo la fuente de verdad para las
   *  finanzas: los registros viejos solo tienen esto. */
  precio: number;
  /** Desglose opcional: el total sale de cantidadNum × precioUnitario en vez de
   *  que alguien lo multiplique de cabeza en el campo. */
  cantidadNum?: number;
  unidad?: string;
  precioUnitario?: number;
  comprador?: string;
  cobrado: boolean;
  /** Cosecha de la que salió esta venta, si se registraron juntas. */
  cosechaId?: string;
  creadoPor: string;
}

/**
 * Algo que pasó en el ciclo y explica los números: no se pudo regar porque no
 * hubo agua, se cayó un palo, hubo granizada, se atrasó la fumigación.
 *
 * Sin esto, un ciclo con mala cosecha se ve idéntico a uno mal manejado. Es lo
 * que le permite a Freddy —y a un banco— entender por qué un lote rindió menos.
 */
export interface Novedad {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  /** Si ya se resolvió o sigue afectando al ciclo. */
  resuelta: boolean;
  /**
   * Cuándo se escribió la novedad, que no es lo mismo que cuándo pasó: se puede
   * anotar el lunes algo que pasó el sábado. Para que sirva de respaldo ante un
   * banco o un seguro, tiene que constar cuándo quedó registrada.
   */
  creadoEn: number;
  creadoPor: string;
}

// A propósito sin loteId/cicloId: un mismo insumo suele repartirse entre
// varios lotes, así que atarlo a uno solo daría un costo por lote falso.
// Vive como gasto general del negocio en Finanzas, igual que Jornal. El
// costo SÍ termina llegando a cada lote, pero indirectamente: la compra
// carga stock en el InsumoInventario, y cada Aplicacion (que sí es
// lote-específica) descuenta de ahí y calcula su propio costoEstimado.
export interface CompraInsumo {
  id: string;
  insumoId?: string; // ausente en registros viejos, de antes del inventario
  producto: string;
  cantidad?: number; // cuánto se compró, en la unidad del insumo
  costo: number;
  fecha: string;
  proveedor?: string;
  personaQueCompro: string;
  fotoFacturaUrl?: string;
  creadoPor: string;
}

/** Catálogo de insumos con stock y costo unitario, alimentado por CompraInsumo y consumido por Aplicacion. */
export interface InsumoInventario {
  id: string;
  nombre: string;
  unidad: string; // texto libre: "litros", "kg", "bultos", etc.
  stockActual: number;
  costoUnitario: number; // precio de la compra más reciente de este insumo
  creadoPor: string;
}

/**
 * Movimiento de inventario. Costeo por último precio de compra, no
 * promedio ponderado: el promedio exigiría leer el valor actual antes de
 * escribir (transacción), y las transacciones de Firestore no funcionan
 * offline. Con increment() para el stock y un simple set del costoUnitario
 * más reciente, todo el flujo sigue funcionando sin señal en el campo.
 */
export interface MovimientoInventario {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  costoUnitario: number;
  fecha: string;
  origen: 'compra' | 'aplicacion' | 'ajuste'; // 'ajuste': reversión de una salida vieja al editar una aplicación
  origenId: string;
  loteId?: string; // solo en salidas, para trazabilidad
  creadoPor: string;
}

// A propósito sin loteId/cicloId: con pocos trabajadores y pagos esporádicos,
// no vale la pena obligar a atar cada jornal a un lote puntual. Vive como
// gasto general del negocio en Finanzas, no dentro del resumen de cada ciclo.
export interface Jornal {
  id: string;
  loteId?: string; // opcional: solo si el jornal fue claramente para un lote puntual
  trabajador: string;
  quienPago: string;
  labor?: string;
  fecha: string;
  unidad: 'dia' | 'hora';
  cantidad: number;
  tarifa: number;
  valor: number; // cantidad * tarifa, guardado para no tener que recalcular
  pagado: boolean;
  creadoPor: string;
}
