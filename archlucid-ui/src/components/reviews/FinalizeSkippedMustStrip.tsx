"use client";

import { cn } from "@/lib/utils";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { describeSkippedMustMeasurementGap } from "@/lib/intake/universal-intake-must-engine-coverage";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type FinalizeSkippedMustStripProps = {
  readonly transparencyTrail: TransparencyTrail | null | undefined;
  readonly className?: string;
};

/** Loud skipped-MUST visibility adjacent to finalize controls (LI-03; LI-04 owns the gate). */
export function FinalizeSkippedMustStrip(props: FinalizeSkippedMustStripProps): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const skippedMustKeys = listSkippedMustQuestionKeys(props.transparencyTrail);

  if (!isWorkingMode || skippedMustKeys.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100",
        props.className,
      )}
      data-testid="finalize-skipped-must-strip"
      role="status"
    >
      <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>
        Skipped required questions ({skippedMustKeys.length})
      </p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Answer these before you finalize, or record why you are sealing with measurement gaps on the sealed record.
      </p>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {skippedMustKeys.map((questionKey) => (
          <li key={questionKey}>{describeSkippedMustMeasurementGap(questionKey)}</li>
        ))}
      </ul>
    </div>
  );
}
