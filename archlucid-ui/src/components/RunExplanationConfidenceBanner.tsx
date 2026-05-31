import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operatorConfidenceSurface } from "@/lib/design-tokens";
import {
  buildExplanationConfidenceSummary,
  type ExplanationConfidenceDisposition,
} from "@/lib/run-explanation-confidence-disposition";
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

  return (
    <Card
      className={`rounded-lg border shadow-sm ${dispositionClass(confidence.disposition)}`}
      data-testid="run-explanation-confidence-banner"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Explanation confidence — {confidence.disposition}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-sm">
        <p className="m-0 font-medium">{confidence.title}</p>
        <p className="m-0">{confidence.detail}</p>
      </CardContent>
    </Card>
  );
}
