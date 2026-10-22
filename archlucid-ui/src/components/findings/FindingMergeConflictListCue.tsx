"use client";

import Link from "next/link";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isFindingMergeConflictReviewFinding } from "@/lib/review-quality/finding-quality-signals";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type FindingMergeConflictListCueProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
};

/** Working findings list cue when merge conflicts are already on the wire (RS-14). */
export function FindingMergeConflictListCue(props: FindingMergeConflictListCueProps): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return null;
  }

  const conflictFindings = props.findings.filter((finding) => isFindingMergeConflictReviewFinding(finding));

  if (conflictFindings.length === 0) {
    return null;
  }

  const first = conflictFindings[0];

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
      data-testid="finding-merge-conflict-list-cue"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {conflictFindings.length === 1
          ? "This review has an unresolved finding merge conflict."
          : `${conflictFindings.length} finding merge conflicts need resolution on this review.`}
      </p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={`/architecture/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(first.findingId)}`}
          className={OPERATOR_LINK.nav}
        >
          Open merge conflict resolution
        </Link>
      </p>
    </div>
  );
}
