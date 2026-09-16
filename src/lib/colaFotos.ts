/**
 * Cola de fotos pendientes de subir, guardada en IndexedDB.
 *
 * Antes vivía en localStorage y no servía: localStorage guarda texto, así que
 * la foto había que convertirla a base64 (+33%) y encima el navegador guarda
 * cada carácter en 2 bytes. Una foto de 3 MB terminaba ocupando 8,22 MB contra
 * un tope de ~5 MB para TODO el sitio: la primera entraba raspando y la
 * segunda reventaba con QuotaExceededError.
 *
 * En IndexedDB el archivo se guarda tal cual, sin convertir, y el espacio se
 * mide en gigabytes. La misma foto ocupa 3 MB y caben cientos.
 */

const BASE = 'agrodata-fotos';
const ALMACEN = 'pendientes';

export interface DestinoFoto {
  coleccion: string;
  docId: string;
  campo: string;
}

export interface FotoPendiente extends DestinoFoto {
  id: string;
  archivo: Blob;
  creadoEn: number;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BASE, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ALMACEN)) {
        req.result.createObjectStore(ALMACEN, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function conAlmacen<T>(modo: IDBTransactionMode, fn: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(ALMACEN, modo);
        const req = fn(tx.objectStore(ALMACEN));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

/** Avisa al indicador del header que la cola cambió. */
function avisar() {
  window.dispatchEvent(new Event('agrodata:fotos-pendientes'));
}

export async function encolarFoto(archivo: Blob, destino: DestinoFoto): Promise<void> {
  await conAlmacen('readwrite', (a) =>
    a.put({ id: crypto.randomUUID(), archivo, creadoEn: Date.now(), ...destino }),
  );
  avisar();
}

export async function listarFotos(): Promise<FotoPendiente[]> {
  return conAlmacen<FotoPendiente[]>('readonly', (a) => a.getAll() as IDBRequest<FotoPendiente[]>);
}

export async function borrarFoto(id: string): Promise<void> {
  await conAlmacen('readwrite', (a) => a.delete(id) as unknown as IDBRequest<undefined>);
  avisar();
}

export async function contarFotos(): Promise<number> {
  try {
    return await conAlmacen<number>('readonly', (a) => a.count());
  } catch {
    return 0;
  }
}
