import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY, operatorConfidenceSurface } from "@/lib/design-tokens";
import {
  buildExplanationConfidenceSummary,
  type ExplanationConfidenceDisposition,
} from "@/lib/runs/run-explanation-confidence-disposition";
import { buyerExplanationConfidenceDispositionLabel } from "@/lib/buyer/buyer-explanation-confidence-labels";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { RunExplanationSummary } from "@/types/explanation";

function dispositionClass(disposition: ExplanationConfidenceDisposition): string {
  switch (disposition) {
    case "PASS":
      return operatorConfidenceSurface("high");

    case "WARN":
      return operatorConfidenceSurface("medium");

    case "HOLD":
      return operatorConfidenceSurface("low");

    default: {
      const _exhaustive: never = disposition;

      return _exhaustive;
    }
  }
}

/** Visible WARN/HOLD banner for low-confidence aggregate explanations (#20). */
export function RunExplanationConfidenceBanner(props: {
  readonly summary: RunExplanationSummary | null;
}): ReactElement | null {
  const confidence = buildExplanationConfidenceSummary(props.summary);

  if (confidence === null)
    return null;

  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const dispositionLabel = buyerPolished
    ? buyerExplanationConfidenceDispositionLabel(confidence.disposition)
    : confidence.disposition;

  return (
    <Card
      className={`rounded-lg border shadow-sm ${dispositionClass(confidence.disposition)}`}
      data-testid="run-explanation-confidence-banner"
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {buyerPolished ? `Explanation confidence: ${dispositionLabel}` : `Explanation confidence — ${dispositionLabel}`}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2 pt-0", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0 font-medium">{confidence.title}</p>
        <p className="m-0">{confidence.detail}</p>
      </CardContent>
    </Card>
  );
}
