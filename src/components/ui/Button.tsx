import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, CSSProperties> = {
  primary: { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' },
  secondary: { backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
  danger: { backgroundColor: 'var(--peligro)', color: '#fbfaf2' },
  ghost: { backgroundColor: 'transparent', color: 'var(--text-dim)' },
};

export default function Button({ variant = 'primary', className = '', style, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${className}`}
      style={{ ...variants[variant], ...style }}
      {...props}
    />
  );
}
