"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AzureExtractorUploadProgressBarProps = {
  /** 0–100 when known; omit for indeterminate. */
  percent?: number | null;
  label: string;
  testId?: string;
  className?: string;
};

/** Compact progress indicator for extractor ZIP read/upload operations. */
export function AzureExtractorUploadProgressBar(props: AzureExtractorUploadProgressBarProps) {
  const { percent, label, testId = "azure-extractor-upload-progress", className } = props;
  const hasPercent = percent !== null && percent !== undefined && Number.isFinite(percent);
  const clampedPercent = hasPercent ? Math.min(100, Math.max(0, Math.round(percent))) : null;

  return (
    <div className={cn("space-y-1", className)} data-testid={testId}>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{label}</p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercent ?? undefined}
        aria-label={label}
      >
        {hasPercent ? (
          <div
            className="h-full rounded-full bg-teal-700 transition-[width] duration-200 dark:bg-teal-500"
            style={{ width: `${clampedPercent}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-700 dark:bg-teal-500" />
        )}
      </div>
    </div>
  );
}
