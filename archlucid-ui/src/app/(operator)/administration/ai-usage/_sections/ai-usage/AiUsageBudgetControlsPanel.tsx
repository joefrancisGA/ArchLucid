"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly canManageBudget: boolean;
};

export function AiUsageBudgetControlsPanel(props: Props) {
  if (!props.canManageBudget) {
    return null;
  }

  return (
    <Card data-testid="ai-usage-budget-controls-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Budget controls</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Adjust monthly limits, warning thresholds, and hard-stop behavior for AI-consuming workflows.
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap gap-2")}>
        <Button asChild variant="outline" size="sm" data-testid="ai-usage-edit-monthly-budget">
          <Link href="/administration/billing#billing-ai-credits">Edit monthly budget</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/administration/billing#billing-usage">Set warning threshold</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/administration/billing#billing-usage">Configure hard-stop behavior</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/administration/recurrence">Pause scheduled AI operations</Link>
        </Button>
        <p className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Approval thresholds above spend limits are managed in{" "}
          <Link href="/administration/billing" className={OPERATOR_LINK.nav}>
            billing settings
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
