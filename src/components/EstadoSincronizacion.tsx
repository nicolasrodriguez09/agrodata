import { useEffect, useState } from 'react';
import { waitForPendingWrites } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cantidadFotosPendientes } from '../lib/cloudinary';
import InfoDialog from './ui/InfoDialog';

/**
 * Indicador de conexión del header. En el campo casi nunca hay señal, así que
 * lo importante es que quede clarísimo que lo registrado NO se perdió: se
 * guarda en el teléfono y sube solo cuando vuelve el internet.
 */
export default function EstadoSincronizacion() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [subiendo, setSubiendo] = useState(false);
  const [fotos, setFotos] = useState(cantidadFotosPendientes());
  const [explicacion, setExplicacion] = useState(false);

  useEffect(() => {
    const conectado = () => setEnLinea(true);
    const desconectado = () => setEnLinea(false);
    window.addEventListener('online', conectado);
    window.addEventListener('offline', desconectado);
    return () => {
      window.removeEventListener('online', conectado);
      window.removeEventListener('offline', desconectado);
    };
  }, []);

  // La cola de fotos vive en localStorage; cloudinary.ts avisa cuando cambia.
  useEffect(() => {
    const revisar = () => setFotos(cantidadFotosPendientes());
    window.addEventListener('agrodata:fotos-pendientes', revisar);
    const reloj = setInterval(revisar, 4000);
    return () => {
      window.removeEventListener('agrodata:fotos-pendientes', revisar);
      clearInterval(reloj);
    };
  }, []);

  // Al volver la señal, Firestore empieza a mandar lo que quedó guardado local.
  // waitForPendingWrites se resuelve cuando el servidor ya confirmó todo.
  useEffect(() => {
    if (!enLinea) return;
    let vigente = true;
    setSubiendo(true);
    waitForPendingWrites(db).finally(() => {
      if (vigente) setSubiendo(false);
    });
    return () => {
      vigente = false;
    };
  }, [enLinea]);

  const estado = !enLinea
    ? { color: '#e0a458', texto: 'Sin conexión', pulso: false }
    : subiendo || fotos > 0
      ? {
          color: '#e0a458',
          texto: fotos > 0 ? `Subiendo ${fotos} ${fotos === 1 ? 'foto' : 'fotos'}` : 'Guardando...',
          pulso: true,
        }
      : { color: '#7fa650', texto: 'Todo guardado', pulso: false };

  return (
    <>
      <button
        onClick={() => setExplicacion(true)}
        aria-label={`Estado: ${estado.texto}. Toca para saber más`}
        className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pr-2.5 pl-2 text-xs font-medium"
      >
        <span className="relative flex h-2 w-2 flex-none">
          {estado.pulso && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: estado.color }}
            />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: estado.color }} />
        </span>
        <span className="hidden opacity-90 min-[380px]:inline">{estado.texto}</span>
      </button>

      <InfoDialog
        open={explicacion}
        title={estado.texto}
        description={
          !enLinea
            ? 'No hay internet en este momento. Puedes seguir registrando normal: todo queda guardado en el teléfono y se sube solo apenas vuelva la señal. No cierres la aplicación hasta que diga "Todo guardado".'
            : fotos > 0
              ? `Quedaron ${fotos} ${fotos === 1 ? 'foto' : 'fotos'} de factura por subir. Se están mandando ahora; deja la aplicación abierta un momento.`
              : 'Todos los registros y las fotos ya quedaron guardados en la nube. Puedes cerrar la aplicación tranquilo.'
        }
        tono={enLinea && fotos === 0 && !subiendo ? 'exito' : 'aviso'}
        onClose={() => setExplicacion(false)}
      />
    </>
  );
}
