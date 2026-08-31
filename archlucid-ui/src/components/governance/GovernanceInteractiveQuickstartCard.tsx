"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceInteractiveQuickstartContent } from "@/components/governance/GovernanceInteractiveQuickstartContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GovernanceInteractiveQuickstartCardProps = {
  /** Hide the First 30 days onboarding link (buyer-polished workflow surface). */
  hideFirst30DaysLink?: boolean;
  /** Omit the card title when an outer shell (e.g. CollapsibleSection) already supplies it. */
  suppressCardTitle?: boolean;
  className?: string;
};

/**
 * Condensed governance path for first-time operators: links policy packs, review creation, and deeper walkthrough.
 */
export function GovernanceInteractiveQuickstartCard({
  hideFirst30DaysLink = false,
  suppressCardTitle = false,
  className,
}: GovernanceInteractiveQuickstartCardProps) {
  return (
    <Card
      className={cn(
        "mb-6 border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
        className,
      )}
    >
      <CardHeader className={cn("space-y-1 pb-2", suppressCardTitle && "pt-0")}>
        {suppressCardTitle ? null : (
          <CardTitle className={OPERATOR_TYPOGRAPHY.body}>How governance approval works</CardTitle>
        )}
      </CardHeader>
      <CardContent className={cn("pb-3 pt-0", suppressCardTitle && "pt-0")}>
        <GovernanceInteractiveQuickstartContent hideFirst30DaysLink={hideFirst30DaysLink} />
      </CardContent>
    </Card>
  );
}
