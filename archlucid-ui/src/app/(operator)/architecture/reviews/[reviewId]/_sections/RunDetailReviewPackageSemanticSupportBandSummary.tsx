"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  countDecisionGradeSemanticSupportBandsForPresentation,
  formatStampSemanticSupportBandLineForPresentation,
  formatStampUnsupportedSemanticSupportLabels,
  listUnsupportedDecisionGradeSemanticSupportFindingsForPresentation,
  stampSemanticSupportShowsAllClearForPresentation,
} from "@/lib/findings/semantic-support-band-stamp";
import {
  shouldPresentSemanticSupportBandAsRehearsal,
} from "@/lib/governance/simulator-career-honesty";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";

export type RunDetailReviewPackageSemanticSupportBandSummaryProps = {
  readonly findings: readonly QuickDecisionFinding[];
  readonly className?: string;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
};

/** AS-062 / IS-06: decision-grade semantic support band counts on the stamp band. */
export function RunDetailReviewPackageSemanticSupportBandSummary(
  props: RunDetailReviewPackageSemanticSupportBandSummaryProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const counts = countDecisionGradeSemanticSupportBandsForPresentation(
    props.findings,
    props.structuralExecutionMode,
  );
  const line = formatStampSemanticSupportBandLineForPresentation(
    counts,
    props.structuralExecutionMode,
    { compact: !isWorkingMode },
  );
  const unsupportedEntries = listUnsupportedDecisionGradeSemanticSupportFindingsForPresentation(
    props.findings,
    props.structuralExecutionMode,
  );
  const unsupportedLabels = formatStampUnsupportedSemanticSupportLabels(unsupportedEntries);

  if (line === null) {
    return null;
  }

  const showAllClearHonesty = stampSemanticSupportShowsAllClearForPresentation(
    counts,
    props.structuralExecutionMode,
  );

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        props.className,
      )}
      data-testid="run-detail-stamp-semantic-support-band-summary"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Semantic support
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-stamp-semantic-support-band-line"
      >
        {line}
      </p>
      {showAllClearHonesty ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-stamp-semantic-support-all-clear"
        >
          No unsupported decision-grade findings on this stamp.
        </p>
      ) : null}
      {unsupportedLabels.length > 0 ? (
        <ul
          className={cn("m-0 mt-1 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-stamp-semantic-support-unsupported-list"
        >
          {unsupportedLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {!shouldPresentSemanticSupportBandAsRehearsal(props.structuralExecutionMode) && counts.unchecked > 0 ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-stamp-semantic-support-lane-b-honesty"
        >
          {SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY}
        </p>
      ) : null}
    </div>
  );
}
