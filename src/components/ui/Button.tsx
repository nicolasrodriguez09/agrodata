import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-green-700 text-white hover:bg-green-800 shadow-sm shadow-green-900/10 disabled:hover:bg-green-700',
  secondary:
    'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 disabled:hover:bg-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
  ghost: 'bg-transparent text-stone-600 hover:bg-stone-100 disabled:hover:bg-transparent',
};

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium transition disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
