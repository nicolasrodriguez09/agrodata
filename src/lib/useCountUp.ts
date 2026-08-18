import { useEffect, useRef, useState } from 'react';

/** Anima un número entero desde su valor anterior hasta valorFinal (ease-out). */
export function useCountUp(valorFinal: number, duracionMs = 700) {
  const [valor, setValor] = useState(valorFinal);
  const desdeRef = useRef(valorFinal);

  useEffect(() => {
    const desde = desdeRef.current;
    let inicio: number | null = null;
    let frame: number;

    function tick(t: number) {
      if (inicio === null) inicio = t;
      const progreso = Math.min((t - inicio) / duracionMs, 1);
      const facilitado = 1 - Math.pow(1 - progreso, 3);
      setValor(Math.round(desde + (valorFinal - desde) * facilitado));
      if (progreso < 1) frame = requestAnimationFrame(tick);
      else desdeRef.current = valorFinal;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Solo se re-dispara cuando cambia el valor objetivo, no en cada frame propio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorFinal, duracionMs]);

  return valor;
}
