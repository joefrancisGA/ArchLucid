import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RUN_DETAIL_GOVERNANCE_CTA_LABEL,
  runDetailGovernanceWorkflowHref,
} from "@/lib/runs/run-detail-governance-cta-visibility";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailGovernanceCtaProps = {
  readonly runId: string;
  /** Secondary placement when the summary header owns the primary governance CTA (TB-618). */
  readonly demoted?: boolean;
};

/** Forward-path CTA from review detail to approval workflow when approval is still pending (TB-521). */
export function RunDetailGovernanceCta(props: RunDetailGovernanceCtaProps): React.JSX.Element {
  const { runId, demoted = false } = props;

  return (
    <Card
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="run-detail-governance-cta"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Approval
        </CardTitle>
        <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
          This review is finalized. Continue in the approval queue to submit source and target environments for approval.
        </CardDescription>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        <Button type="button" variant={demoted ? "outline" : "primary"} asChild>
          <Link href={runDetailGovernanceWorkflowHref(runId)}>{RUN_DETAIL_GOVERNANCE_CTA_LABEL}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
