import type { HTMLAttributes } from 'react';

export default function Card({ className = '', style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', ...style }}
      {...props}
    />
  );
}
