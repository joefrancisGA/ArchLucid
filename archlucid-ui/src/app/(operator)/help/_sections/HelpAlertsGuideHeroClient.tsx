"use client";

import Link from "next/link";

import { HelpAlertsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpAlertsWorkspaceReadinessStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALERTS_HELP_ACTION_PANEL_CONSEQUENCES,
  ALERTS_HELP_ACTION_PANEL_TITLES,
  ALERTS_HELP_PRIMARY_ACTIONS,
  resolveAlertsHelpActionPanelState,
} from "@/lib/alerts-help-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { useAlertsHelpWorkspaceReadiness } from "@/lib/use-alerts-help-workspace-readiness";

/** Shared client hero for `/help/alerts` — one readiness fetch for panel and strip. */
export function HelpAlertsGuideHeroClient(): React.ReactElement {
  const readiness = useAlertsHelpWorkspaceReadiness();
  const panelState = resolveAlertsHelpActionPanelState(readiness);
  const rulesNotConfigured = panelState === "rules-not-configured";
  const readyForInbox = panelState === "ready-for-inbox";
  const loading = panelState === "loading";

  return (
    <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <Card
        className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
        data-testid="help-alerts-action-panel"
      >
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {ALERTS_HELP_ACTION_PANEL_TITLES[panelState]}
          </CardTitle>
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {ALERTS_HELP_ACTION_PANEL_CONSEQUENCES[panelState]}
          </p>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
          {rulesNotConfigured ? (
            <>
              <Button asChild data-testid="help-alerts-primary-cta" size="sm" variant="primary">
                <Link href={ALERTS_HELP_PRIMARY_ACTIONS.configureRules.href}>
                  {ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ALERTS_HELP_PRIMARY_ACTIONS.openInbox.href}>
                  {ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label}
                </Link>
              </Button>
            </>
          ) : readyForInbox ? (
            <>
              <Button asChild data-testid="help-alerts-primary-cta" size="sm" variant="primary">
                <Link href={ALERTS_HELP_PRIMARY_ACTIONS.openInbox.href}>
                  {ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ALERTS_HELP_PRIMARY_ACTIONS.configureRules.href}>
                  {ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label}
                </Link>
              </Button>
            </>
          ) : loading ? (
            <Button data-testid="help-alerts-primary-cta" disabled size="sm" variant="primary">
              {ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label}
            </Button>
          ) : (
            <Button asChild data-testid="help-alerts-primary-cta" size="sm" variant="primary">
              <Link href={ALERTS_HELP_PRIMARY_ACTIONS.openInbox.href}>
                {ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label}
              </Link>
            </Button>
          )}
          <Link
            className={cn(
              "text-sm underline-offset-2 hover:underline",
              DESIGN_TOKENS.accent.link,
              OPERATOR_TYPOGRAPHY.body,
            )}
            href={ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.href}
          >
            {ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.label}
          </Link>
        </CardContent>
      </Card>

      <HelpAlertsWorkspaceReadinessStrip readiness={readiness} />
    </div>
  );
}
