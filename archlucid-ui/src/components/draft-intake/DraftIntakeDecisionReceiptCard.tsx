"use client";

import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import {
  feasibilityVerdictKindLabel,
  feasibilityVerdictTone,
} from "@/lib/feasibility-verdict-display";
import { DECISION_RECEIPT_COST_ESTIMATE_LABEL } from "@/lib/decision-receipt-export";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { DecisionReceiptExportButton } from "./DecisionReceiptExportButton";

export type DraftIntakeDecisionReceiptCardProps = {
  readonly draftId: string;
  readonly redirectReason: string;
  readonly verdict: ManifestFeasibilityVerdict;
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
};

/**
 * First-class "reasoned no" surface for admission redirects (ADR 0052 / R13).
 */
export function DraftIntakeDecisionReceiptCard(props: DraftIntakeDecisionReceiptCardProps) {
  const tone = feasibilityVerdictTone(props.verdict.kind);

  let toneClass = "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40";

  if (tone === "danger") {
    toneClass = "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40";
  }

  return (
    <Card className={toneClass} data-testid="draft-intake-decision-receipt-card">
      <CardHeader>
        <CardTitle className="text-base">Decision receipt — intake not admitted</CardTitle>
        <CardDescription>
          {props.redirectReason} This is a complete product outcome, not an error dead-end (ADR 0052).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DraftIntakeClaimLabel surface="redirected-draft" />
        <p className="m-0 text-sm font-semibold">{feasibilityVerdictKindLabel(props.verdict.kind)}</p>
        <p className="m-0 text-sm leading-relaxed">{props.verdict.summary}</p>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Cost story ({DECISION_RECEIPT_COST_ESTIMATE_LABEL}): ~$1 session vs ~$25k / 2–4 weeks of human
          architecture review avoided.
        </p>
        <DecisionReceiptExportButton
          context={{
            source: "draft-admission",
            draftId: props.draftId,
            redirectReason: props.redirectReason,
            verdict: props.verdict,
            freeTextIntent: props.freeTextIntent,
            businessOutcome: props.businessOutcome,
            systemName: props.systemName,
          }}
        />
      </CardContent>
    </Card>
  );
}
