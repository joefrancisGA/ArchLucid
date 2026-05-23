"use client";

import { CopyIdButton } from "@/components/CopyIdButton";

export type ApiErrorToastContentProps = {
  readonly title: string;
  readonly detail?: string | null;
  readonly correlationId?: string | null;
};

/** Sonner toast body for API failures — surfaces correlation id with one-click copy. */
export function ApiErrorToastContent(props: ApiErrorToastContentProps) {
  const trimmedCorrelation = props.correlationId?.trim() ?? "";
  const detail = props.detail?.trim() ?? "";

  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="api-error-toast-content">
      <p className="m-0 font-medium">{props.title}</p>
      {detail.length > 0 ? <p className="m-0 text-neutral-600 dark:text-neutral-300">{detail}</p> : null}
      {trimmedCorrelation.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Correlation ID</span>
          <code className="max-w-[14rem] truncate rounded bg-neutral-100 px-1 py-0.5 font-mono text-[11px] dark:bg-neutral-800">
            {trimmedCorrelation}
          </code>
          <CopyIdButton value={trimmedCorrelation} aria-label="Copy correlation ID" />
        </div>
      ) : null}
    </div>
  );
}
