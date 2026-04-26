import type { ReactNode } from "react";

import { ContextualHelp } from "@/components/ContextualHelp";

export type OperatorPageHeaderProps = {
  title: string;
  subtitle?: string;
  helpKey?: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function OperatorPageHeader({
  title,
  subtitle,
  helpKey,
  metadata,
  actions,
  children,
}: OperatorPageHeaderProps) {
  return (
    <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-xl font-bold text-neutral-900 dark:text-neutral-50">{title}</h2>
        {helpKey != null && <ContextualHelp helpKey={helpKey} />}
        {actions != null && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {subtitle != null && (
        <p className="m-0 mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      )}

      {metadata != null && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          {metadata}
        </div>
      )}

      {children != null && <div className="mt-4">{children}</div>}
    </header>
  );
}
