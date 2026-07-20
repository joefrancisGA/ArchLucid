import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PRIVACY_POINTS = [
  "Learning is isolated to your organization and current workspace scope.",
  "Customer architecture content is not shared across organizations.",
  "Sensitive evidence and secrets are never exposed in learning summaries.",
  "Only permitted historical recommendation outcomes contribute to ranking weights.",
] as const;

export function RecommendationLearningHowItWorksCard(): ReactElement {
  return (
    <Card id="how-learning-works" className="border-neutral-200 dark:border-neutral-700">
      <CardHeader className={OPERATOR_CARD.header}>
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>How learning works</h3>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
        <ul className={cn("m-0 list-disc space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {PRIVACY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
