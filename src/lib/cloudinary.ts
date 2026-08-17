import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const PENDING_KEY = 'agrodata_fotos_pendientes';

interface DestinoFoto {
  coleccion: string;
  docId: string;
  campo: string;
}

interface FotoPendiente extends DestinoFoto {
  id: string;
  dataUrl: string;
  creadoEn: number;
}

function leerPendientes(): FotoPendiente[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function guardarPendientes(items: FotoPendiente[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function subirDataUrl(dataUrl: string): Promise<string> {
  const form = new FormData();
  form.append('file', dataUrl);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Error subiendo la foto a Cloudinary');
  const data = await res.json();
  return data.secure_url as string;
}

function encolarPendiente(dataUrl: string, destino: DestinoFoto) {
  const pendientes = leerPendientes();
  pendientes.push({ id: crypto.randomUUID(), dataUrl, creadoEn: Date.now(), ...destino });
  guardarPendientes(pendientes);
}

/**
 * Sube una foto (de factura u otro documento) y la asocia al campo indicado
 * del documento de Firestore. Si no hay conexión o falla la subida, la deja
 * en una cola local y se reintenta sola con reintentarPendientes() cuando
 * vuelve la señal — el documento igual queda creado, solo el campo de foto
 * se completa después.
 */
export async function subirFoto(file: File, destino: DestinoFoto): Promise<string | null> {
  const dataUrl = await fileToDataUrl(file);

  if (!navigator.onLine) {
    encolarPendiente(dataUrl, destino);
    return null;
  }

  try {
    const url = await subirDataUrl(dataUrl);
    await updateDoc(doc(db, destino.coleccion, destino.docId), { [destino.campo]: url });
    return url;
  } catch {
    encolarPendiente(dataUrl, destino);
    return null;
  }
}

export function cantidadFotosPendientes(): number {
  return leerPendientes().length;
}

/** Reintenta subir todas las fotos guardadas localmente. Llamar al volver la conexión. */
export async function reintentarPendientes(): Promise<void> {
  const pendientes = leerPendientes();
  if (pendientes.length === 0) return;

  const siguenPendientes: FotoPendiente[] = [];
  for (const foto of pendientes) {
    try {
      const url = await subirDataUrl(foto.dataUrl);
      await updateDoc(doc(db, foto.coleccion, foto.docId), { [foto.campo]: url });
    } catch {
      siguenPendientes.push(foto);
    }
  }
  guardarPendientes(siguenPendientes);
}
