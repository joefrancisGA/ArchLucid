"use client";

import Link from "next/link";

import { HelpAlertsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpAlertsWorkspaceReadinessStrip";
import { Button } from "@/components/ui/button";
import {
  ALERTS_HELP_ACTION_PANEL_CONSEQUENCES,
  ALERTS_HELP_ACTION_PANEL_TITLES,
  ALERTS_HELP_PRIMARY_ACTIONS,
  resolveAlertsHelpActionPanelState,
} from "@/lib/alerts-help-guide-content";
import { cn } from "@/lib/utils";
import {
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
      <section
        aria-labelledby="help-alerts-action-panel-heading"
        className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="help-alerts-action-panel"
      >
        <h2
          id="help-alerts-action-panel-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {ALERTS_HELP_ACTION_PANEL_TITLES[panelState]}
        </h2>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ALERTS_HELP_ACTION_PANEL_CONSEQUENCES[panelState]}
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
              "text-[var(--al-accent-link)]",
              OPERATOR_TYPOGRAPHY.body,
            )}
            href={ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.href}
          >
            {ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.label}
          </Link>
        </div>
      </section>

      <HelpAlertsWorkspaceReadinessStrip readiness={readiness} />
    </div>
  );
}
