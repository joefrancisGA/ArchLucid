"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildBulkTriageRemainingProgress,
  type BulkTriageRemainingProgressInput,
} from "@/lib/bulk-triage-remaining-progress";
import { cn } from "@/lib/utils";

export type BulkTriageRemainingProgressProps = BulkTriageRemainingProgressInput & {
  readonly className?: string;
};

/**
 * Compact finish-line chip for bulk triage queues (TB-2213).
 * Hidden when totalInView is zero.
 */
export function BulkTriageRemainingProgress(
  props: BulkTriageRemainingProgressProps,
): ReactElement | null {
  const progress = buildBulkTriageRemainingProgress({
    openCount: props.openCount,
    totalInView: props.totalInView,
  });

  if (!progress.visible) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-neutral-300 bg-neutral-50 px-2 py-1 text-neutral-700 tabular-nums dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
        OPERATOR_TYPOGRAPHY.badge,
        props.className,
      )}
      data-testid="bulk-triage-remaining-progress"
      role="status"
      aria-label={progress.label}
      data-complete={progress.complete ? "true" : "false"}
    >
      {progress.label}
    </span>
  );
}