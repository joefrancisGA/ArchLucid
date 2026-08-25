"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { FindingMergeConflictResolvePanel } from "@/components/findings/FindingMergeConflictResolvePanel";
import { Button } from "@/components/ui/button";
import { mapInspectPayloadToQuickDecisionFinding } from "@/lib/findings/finding-inspect-job-view";
import { isFindingMergeConflictReviewFinding } from "@/lib/review-quality/finding-quality-signals";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingDetailOperationalActionsProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly payload: FindingInspectPayload;
  readonly graphEvidenceHref: string | null;
  readonly linkedManifestHref: string | null;
  readonly inspectHref: string;
};

/** Grouped primary finding actions — navigation as links; work-item handoff as a button. */
export function FindingDetailOperationalActions(props: FindingDetailOperationalActionsProps): React.JSX.Element {
  const mergeConflictFinding = mapInspectPayloadToQuickDecisionFinding(props.payload);

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="finding-detail-operational-actions"
      aria-label="Finding actions"
    >
      <p className={cn("m-0 mb-2 font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Actions
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="default" size="sm" asChild data-testid="finding-detail-primary-evidence-trace">
          <Link href={props.inspectHref}>Open evidence trace</Link>
        </Button>
        {props.graphEvidenceHref !== null ? (
          <Link href={props.graphEvidenceHref} className={OPERATOR_LINK.nav}>
            {BUYER_SURFACE_VOCABULARY.evidenceGraphNav}
          </Link>
        ) : null}
        {props.linkedManifestHref !== null ? (
          <Link href={props.linkedManifestHref} className={OPERATOR_LINK.nav}>
            {`Open ${SIGNED_MANIFEST_LABEL.toLowerCase()}`}
          </Link>
        ) : null}
        <CopyFindingAsWorkItemButton
          runId={props.runId}
          findingId={props.findingId}
          payload={props.payload}
          compact
        />
      </div>
      {isFindingMergeConflictReviewFinding(mergeConflictFinding) ? (
        <FindingMergeConflictResolvePanel runId={props.runId} findingId={props.findingId} />
      ) : null}
    </section>
  );
}
