import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--nodata)' }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }}
      >
        {icon}
      </div>
      <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--text-dim)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
