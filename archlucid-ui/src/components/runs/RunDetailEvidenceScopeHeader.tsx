import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { TrustEvidenceReadinessVerdict } from "@/lib/trust-evidence-readiness";

export const RUN_DETAIL_EVIDENCE_ITEM_COUNT_NOT_STORED =
  "Evidence item count was not stored." as const;

export const RUN_DETAIL_EVIDENCE_ITEMS_STORED_EMPTY =
  "Evidence items were stored empty." as const;

export const RUN_DETAIL_DELIVERABLE_COUNT_NOT_STORED =
  "Deliverable count was not stored on this review." as const;

export const RUN_DETAIL_DELIVERABLES_STORED_EMPTY =
  "Deliverables were stored empty." as const;

export const RUN_DETAIL_DELIVERABLE_COUNT_MALFORMED =
  "Deliverable count was not readable." as const;

export type RunDetailEvidenceScopeHeaderProps = {
  readonly packageName: string;
  readonly reviewDateLabel: string;
  readonly evidenceItemCount: number | null;
  readonly deliverableCount: number | null;
  readonly deliverableCountMalformed?: boolean;
  readonly readinessHeadline: string;
  readonly readinessVerdict: TrustEvidenceReadinessVerdict;
  readonly evidenceCoverageLine?: string | null;
};

function formatEvidenceItemsCell(count: number | null): string {
  if (count === null) {
    return RUN_DETAIL_EVIDENCE_ITEM_COUNT_NOT_STORED;
  }

  if (count <= 0) {
    return RUN_DETAIL_EVIDENCE_ITEMS_STORED_EMPTY;
  }

  return String(count);
}

function formatDeliverablesCell(
  count: number | null,
  malformed: boolean,
): string {
  if (malformed) {
    return RUN_DETAIL_DELIVERABLE_COUNT_MALFORMED;
  }

  if (count === null) {
    return RUN_DETAIL_DELIVERABLE_COUNT_NOT_STORED;
  }

  if (count <= 0) {
    return RUN_DETAIL_DELIVERABLES_STORED_EMPTY;
  }

  return String(count);
}

export function RunDetailEvidenceScopeHeader(props: RunDetailEvidenceScopeHeaderProps): ReactElement {
  const evidenceCount = props.evidenceItemCount;
  const readinessVerdict: TrustEvidenceReadinessVerdict =
    evidenceCount !== null && evidenceCount === 0 ? "gaps" : props.readinessVerdict;
  const readinessKind = readinessVerdict === "complete" ? "ready" : "needs-attention";
  const coverageLine = props.evidenceCoverageLine?.trim() ?? "";
  const deliverableMalformed = props.deliverableCountMalformed === true;

  return (
    <header
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="run-detail-evidence-scope-header"
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Evidence coverage
      </h2>
      <p className={cn("m-0 mt-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {coverageLine.length > 0 ? coverageLine : props.readinessHeadline}
      </p>
      <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-al-text-secondary">Architecture package</dt>
          <dd className="m-0 mt-0.5 font-semibold text-al-text-primary">{props.packageName}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Review date</dt>
          <dd className="m-0 mt-0.5 font-semibold text-al-text-primary">{props.reviewDateLabel}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Evidence items</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">
            {formatEvidenceItemsCell(evidenceCount)}
          </dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Deliverables</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">
            {formatDeliverablesCell(props.deliverableCount, deliverableMalformed)}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <StatusTag kind={readinessKind} label={props.readinessHeadline} />
      </div>
    </header>
  );
}
