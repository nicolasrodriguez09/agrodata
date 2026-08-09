import type { HTMLAttributes } from 'react';

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 ${className}`}
      {...props}
    />
  );
}
