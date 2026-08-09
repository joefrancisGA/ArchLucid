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
};

export function RunDetailEvidenceScopeHeader(props: RunDetailEvidenceScopeHeaderProps): ReactElement {
  const readinessKind = props.readinessVerdict === "complete" ? "ready" : "needs-attention";

  return (
    <header
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="run-detail-evidence-scope-header"
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Evidence scope — {props.readinessHeadline}
      </h2>
      <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>
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
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">{props.evidenceItemCount}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Deliverables</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-al-text-primary">{props.deliverableCount}</dd>
        </div>
      </dl>
      <div className="mt-3">
        <StatusTag kind={readinessKind} label={props.readinessHeadline} />
      </div>
    </header>
  );
}
