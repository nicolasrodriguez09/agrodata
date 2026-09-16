import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { escribir } from './escrituraOffline';
import { encolarFoto, listarFotos, borrarFoto, contarFotos, type DestinoFoto } from './colaFotos';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export type { DestinoFoto };

/**
 * Cloudinary acepta el archivo directo en el FormData, sin pasarlo a base64.
 * Antes se convertía a texto para poder guardarlo en localStorage; ya no hace
 * falta, y así se sube un 33% menos de bytes.
 */
async function subirArchivo(archivo: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', archivo);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Error subiendo la foto a Cloudinary');
  const data = await res.json();
  return data.secure_url as string;
}

/**
 * Sube una foto (de factura u otro documento) y la asocia al campo indicado del
 * documento de Firestore. Si no hay señal o la subida falla, la deja en la cola
 * de IndexedDB y se reintenta sola con reintentarPendientes() cuando vuelve el
 * internet — el registro igual queda creado, solo la foto se completa después.
 *
 * Nunca lanza: el registro ya está guardado cuando esto corre, así que un
 * problema con la foto no debe mostrarse como "no se pudo guardar" ni empujar a
 * registrar la compra dos veces. Devuelve la URL si subió, o null si quedó en cola.
 */
export async function subirFoto(file: File, destino: DestinoFoto): Promise<string | null> {
  if (navigator.onLine) {
    try {
      const url = await subirArchivo(file);
      escribir(updateDoc(doc(db, destino.coleccion, destino.docId), { [destino.campo]: url }));
      return url;
    } catch {
      // Sigue abajo y la deja en cola.
    }
  }

  try {
    await encolarFoto(file, destino);
  } catch (err) {
    console.error('[agrodata] no se pudo guardar la foto en la cola:', err);
  }
  return null;
}

export function cantidadFotosPendientes(): Promise<number> {
  return contarFotos();
}

/** Reintenta subir todas las fotos que quedaron en cola. Se llama al volver la conexión. */
export async function reintentarPendientes(): Promise<void> {
  if (!navigator.onLine) return;
  let pendientes: Awaited<ReturnType<typeof listarFotos>>;
  try {
    pendientes = await listarFotos();
  } catch {
    return;
  }

  for (const foto of pendientes) {
    try {
      const url = await subirArchivo(foto.archivo);
      escribir(updateDoc(doc(db, foto.coleccion, foto.docId), { [foto.campo]: url }));
      // Solo se saca de la cola si subió: si falla, se reintenta la próxima vez.
      await borrarFoto(foto.id);
    } catch {
      // Se queda en la cola para el siguiente intento.
    }
  }
}
