import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const ENTERPRISE_GUIDE_SECTIONS = [
  {
    title: "What is learned",
    body: "Acceptance, rejection, deferral, and implementation patterns by recommendation category, urgency, and signal type. These patterns adjust future advisory ranking weights.",
  },
  {
    title: "What is not learned",
    body: "Architecture diagrams, evidence file contents, credentials, and free-text review notes are not copied into the learning model.",
  },
  {
    title: "Organization isolation",
    body: "Profiles are stored per tenant and workspace. Outcomes from other customers never influence your recommendation ranking.",
  },
  {
    title: "Resetting learning",
    body: "Recalculate recommendation learning to overwrite the previous learning profile with freshly computed weights. There is no separate delete action.",
  },
  {
    title: "Historical reprocessing",
    body: "Each recalculation scans historical recommendation outcomes again (up to 5,000 records per workspace) and rebuilds weights from scratch.",
  },
] as const;

export function RecommendationLearningEnterpriseGuide(): ReactElement {
  return (
    <Card className="border-neutral-200 dark:border-neutral-700">
      <CardHeader className={OPERATOR_CARD.header}>
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Enterprise readiness</h3>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        {ENTERPRISE_GUIDE_SECTIONS.map((section) => (
          <div key={section.title}>
            <h4 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.title}</h4>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{section.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
