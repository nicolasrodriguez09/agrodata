const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const PENDING_KEY = 'agrodata_fotos_pendientes';

interface FotoPendiente {
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

/**
 * Sube una foto de factura. Si no hay conexión (o falla la subida), la
 * guarda localmente y devuelve null — se reintenta sola con reintentarPendientes()
 * cuando vuelve la señal.
 */
export async function subirFoto(file: File): Promise<string | null> {
  const dataUrl = await fileToDataUrl(file);

  if (!navigator.onLine) {
    encolarPendiente(dataUrl);
    return null;
  }

  try {
    return await subirDataUrl(dataUrl);
  } catch {
    encolarPendiente(dataUrl);
    return null;
  }
}

function encolarPendiente(dataUrl: string) {
  const pendientes = leerPendientes();
  pendientes.push({ id: crypto.randomUUID(), dataUrl, creadoEn: Date.now() });
  guardarPendientes(pendientes);
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
      await subirDataUrl(foto.dataUrl);
    } catch {
      siguenPendientes.push(foto);
    }
  }
  guardarPendientes(siguenPendientes);
}
