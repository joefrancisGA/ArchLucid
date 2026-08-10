import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { TrustEvidenceReadinessVerdict } from "@/lib/trust-evidence-readiness";

export type RunDetailEvidenceScopeHeaderProps = {
  readonly packageName: string;
  readonly reviewDateLabel: string;
  readonly evidenceItemCount: number;
  readonly deliverableCount: number;
  readonly readinessHeadline: string;
  readonly readinessVerdict: TrustEvidenceReadinessVerdict;
  readonly evidenceCoverageLine?: string | null;
};

export function RunDetailEvidenceScopeHeader(props: RunDetailEvidenceScopeHeaderProps): ReactElement {
  const readinessVerdict: TrustEvidenceReadinessVerdict =
    props.evidenceItemCount === 0 ? "gaps" : props.readinessVerdict;
  const readinessKind = readinessVerdict === "complete" ? "ready" : "needs-attention";
  const coverageLine = props.evidenceCoverageLine?.trim() ?? "";
  const showEvidenceItems = props.evidenceItemCount > 0;
  const showDeliverables = props.deliverableCount > 0;

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
        {showEvidenceItems ? (
          <div>
            <dt className="text-al-text-secondary">Evidence items</dt>
            <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">
              {props.evidenceItemCount}
            </dd>
          </div>
        ) : null}
        {showDeliverables ? (
          <div>
            <dt className="text-al-text-secondary">Deliverables</dt>
            <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">
              {props.deliverableCount}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3">
        <StatusTag kind={readinessKind} label={props.readinessHeadline} />
      </div>
    </header>
  );
}
