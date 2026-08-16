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
  producto: string;
  dosis?: string;
  cantidad: string;
  fecha: string;
  responsable: string;
  creadoPor: string;
}

export interface Cosecha {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  calidad?: string;
  creadoPor: string;
}

export interface Venta {
  id: string;
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  precio: number;
  comprador?: string;
  cobrado: boolean;
  creadoPor: string;
}

export interface CompraInsumo {
  id: string;
  loteId: string;
  cicloId: string;
  producto: string;
  costo: number;
  fecha: string;
  proveedor?: string;
  personaQueCompro: string;
  fotoFacturaUrl?: string;
  creadoPor: string;
}

// A propósito sin loteId/cicloId: con pocos trabajadores y pagos esporádicos,
// no vale la pena obligar a atar cada jornal a un lote puntual. Vive como
// gasto general del negocio en Finanzas, no dentro del resumen de cada ciclo.
export interface Jornal {
  id: string;
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
