"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import {
  feasibilityVerdictKindLabel,
  feasibilityVerdictTone,
} from "@/lib/feasibility-verdict-display";
import { DECISION_RECEIPT_COST_ESTIMATE_LABEL } from "@/lib/decision-receipt-export";
import { GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE } from "@/lib/guided-intake-copy";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { DecisionReceiptExportButton } from "./DecisionReceiptExportButton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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

  // `p-0` cancels the callout token's own inset — CardHeader / CardContent already own this card's padding.
  let toneClass = cn(DESIGN_TOKENS.callout.warn, "p-0");

  if (tone === "danger") {
    toneClass = cn(DESIGN_TOKENS.callout.blocked, "p-0");
  }

  return (
    <Card className={toneClass} data-testid="draft-intake-decision-receipt-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.body}>{GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE}</CardTitle>
        <CardDescription>
          {props.redirectReason} This is a complete product outcome, not an error dead-end (ADR 0052).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DraftIntakeClaimLabel surface="redirected-draft" />
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{feasibilityVerdictKindLabel(props.verdict.kind)}</p>
        <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{props.verdict.summary}</p>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
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
