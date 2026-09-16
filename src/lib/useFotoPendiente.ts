import { useEffect, useState } from 'react';
import { fotoPendienteDe } from './colaFotos';

/**
 * URL local para ver una foto que todavía no ha subido, o null si no hay
 * ninguna esperando para ese documento.
 *
 * Solo se busca cuando el documento aún no tiene su URL definitiva; una vez
 * que la foto sube, Firestore actualiza el campo y la pantalla pasa sola a la
 * imagen del servidor.
 */
export function useFotoPendiente(coleccion: string, docId: string, yaTieneUrl: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (yaTieneUrl) {
      setUrl(null);
      return;
    }
    let vigente = true;
    let creada: string | null = null;

    const buscar = () => {
      fotoPendienteDe(coleccion, docId).then((blob) => {
        if (!vigente) return;
        if (creada) URL.revokeObjectURL(creada);
        creada = blob ? URL.createObjectURL(blob) : null;
        setUrl(creada);
      });
    };
    buscar();
    // Cuando la cola cambia (porque subió), se vuelve a mirar.
    window.addEventListener('agrodata:fotos-pendientes', buscar);

    return () => {
      vigente = false;
      window.removeEventListener('agrodata:fotos-pendientes', buscar);
      // Liberar la URL: si no, el Blob se queda en memoria.
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [coleccion, docId, yaTieneUrl]);

  return url;
}
