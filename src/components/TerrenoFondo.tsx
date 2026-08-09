import { useEffect, useRef } from 'react';
import { useTheme } from '../lib/ThemeContext';

/** Fondo con curvas de nivel (mapa topográfico), generado en canvas — sin imágenes externas. */
export default function TerrenoFondo() {
  const divRef = useRef<HTMLDivElement>(null);
  const { tema } = useTheme();

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 420;
    c.height = 420;
    const ctx = c.getContext('2d');
    if (!ctx || !divRef.current) return;

    const oscuro = tema === 'dark';
    ctx.fillStyle = oscuro ? '#0e140d' : '#edf0e2';
    ctx.fillRect(0, 0, 420, 420);
    ctx.strokeStyle = oscuro ? 'rgba(140,170,120,0.16)' : 'rgba(31,70,32,0.10)';
    ctx.lineWidth = 1.4;

    for (let ring = 0; ring < 9; ring++) {
      ctx.beginPath();
      const r = 20 + ring * 24;
      for (let a = 0; a <= 360; a += 4) {
        const rad = (a * Math.PI) / 180;
        const wobble = Math.sin(rad * 3 + ring) * 10 + Math.cos(rad * 5 - ring) * 6;
        const x = 60 + (r + wobble) * Math.cos(rad);
        const y = 340 + (r + wobble) * Math.sin(rad) * 0.6;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let ring = 0; ring < 7; ring++) {
      ctx.beginPath();
      const r = 16 + ring * 22;
      for (let a = 0; a <= 360; a += 4) {
        const rad = (a * Math.PI) / 180;
        const wobble = Math.sin(rad * 4 - ring * 1.3) * 9 + Math.cos(rad * 2 + ring) * 7;
        const x = 340 + (r + wobble) * Math.cos(rad);
        const y = 80 + (r + wobble) * Math.sin(rad) * 0.7;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    divRef.current.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  }, [tema]);

  return (
    <div
      ref={divRef}
      className="fixed inset-0 -z-10 bg-repeat opacity-60"
      style={{ backgroundSize: '420px 420px' }}
      aria-hidden="true"
    />
  );
}
