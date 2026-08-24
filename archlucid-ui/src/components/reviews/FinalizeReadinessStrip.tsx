"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FinalizeReadinessStripProps = {
  readonly commitBlockedReason: string | null | undefined;
};

/** Surfaces server-side finalize blockers before the operator opens the finalize dialog. */
export function FinalizeReadinessStrip(props: FinalizeReadinessStripProps): React.JSX.Element | null {
  const reason = props.commitBlockedReason?.trim() ?? "";

  if (reason.length === 0) {
    return null;
  }

  return (
    <div
      className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
      data-testid="finalize-readiness-strip"
      role="status"
    >
      <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        Finalize is blocked until you resolve the following
      </p>
      <p className={cn("m-0 mt-1 text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>{reason}</p>
    </div>
  );
}
