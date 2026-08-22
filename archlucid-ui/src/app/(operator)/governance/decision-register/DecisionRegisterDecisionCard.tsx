import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

import { DECISION_REGISTER_GOVERNANCE_STATUS_SIGNED, DECISION_REGISTER_OPEN_DECISION_LABEL } from "./decision-register-copy";

function formatRecordedAt(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return " — ";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
}

function formatConfidence(decision: ArchitectureDecisionRegisterEntry): string {
  if (decision.confidence != null) {
    const basis = decision.buyerConfidenceSource ?? decision.confidenceSource;

    if (basis !== null && basis !== undefined && basis.trim().length > 0) {
      return `${decision.confidence} (${basis})`;
    }

    return String(decision.confidence);
  }

  if (decision.buyerConfidenceSource !== null && decision.buyerConfidenceSource !== undefined) {
    return `Unknown (${decision.buyerConfidenceSource})`;
  }

  return "Unknown";
}

type DecisionRegisterDecisionCardProps = {
  readonly decision: ArchitectureDecisionRegisterEntry;
};

export function DecisionRegisterDecisionCard(props: DecisionRegisterDecisionCardProps): React.JSX.Element {
  const { decision } = props;
  const findingCount = decision.supportingFindingIds?.length ?? 0;

  return (
    <Card data-testid={`decision-register-card-${decision.decisionId}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{decision.title}</CardTitle>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={signedRecordDetailPath(decision.manifestId)} data-testid={`decision-register-open-${decision.decisionId}`}>
            {DECISION_REGISTER_OPEN_DECISION_LABEL}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-al-text-secondary">Category</dt>
            <dd className="m-0 font-medium text-al-text-primary">{decision.category || " — "}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Review</dt>
            <dd className="m-0">
              <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${decision.runId}`}>
                Open review
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Recorded date</dt>
            <dd className="m-0 font-medium text-al-text-primary">{formatRecordedAt(decision.recordedAtUtc)}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Confidence</dt>
            <dd className="m-0 font-medium text-al-text-primary">{formatConfidence(decision)}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Supporting findings</dt>
            <dd className="m-0 font-medium text-al-text-primary">{finiteIntegerCountDisplay(findingCount)}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Evidence lineage</dt>
            <dd className="m-0">
              <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(decision.manifestId)}>
                {BUYER_VIEW_SIGNED_RECORD_CTA}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Governance status</dt>
            <dd className="m-0 font-medium text-al-text-primary">{DECISION_REGISTER_GOVERNANCE_STATUS_SIGNED}</dd>
          </div>
        </dl>
        {decision.rationale.trim().length > 0 ? (
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{decision.rationale}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
