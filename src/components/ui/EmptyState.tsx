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
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900/40">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
        {icon}
      </div>
      <p className="font-medium text-stone-800 dark:text-stone-100">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
