"use client";

import { useMemo } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SPONSOR_DASHBOARD_HELP_READINESS_SECTION_TITLE,
} from "@/lib/sponsor-dashboard-help-guide-content";
import type { SponsorDashboardHelpWorkspaceReadinessSnapshot } from "@/lib/use-sponsor-dashboard-help-workspace-readiness";
import { useSponsorDashboardHelpWorkspaceReadiness } from "@/lib/use-sponsor-dashboard-help-workspace-readiness";
import { cn } from "@/lib/utils";

export const HELP_SPONSOR_DASHBOARD_WORKSPACE_READINESS_HEADING_ID =
  "help-sponsor-dashboard-workspace-readiness-heading";

type HelpSponsorDashboardWorkspaceReadinessStripProps = {
  readonly readiness?: SponsorDashboardHelpWorkspaceReadinessSnapshot;
};

/** Live workspace scope and ROI baseline posture for `/help/sponsor-dashboard`. */
export function HelpSponsorDashboardWorkspaceReadinessStrip(
  props: HelpSponsorDashboardWorkspaceReadinessStripProps = {},
): React.ReactElement {
  const hookReadiness = useSponsorDashboardHelpWorkspaceReadiness();
  const readiness = props.readiness ?? hookReadiness;

  const scopeLine = useMemo((): string | null => {
    if (readiness.loading || readiness.workspaceScopeLabel === null) {
      return null;
    }

    return readiness.workspaceScopeLabel;
  }, [readiness.loading, readiness.workspaceScopeLabel]);

  return (
    <section
      aria-busy={readiness.loading ? true : undefined}
      aria-labelledby={HELP_SPONSOR_DASHBOARD_WORKSPACE_READINESS_HEADING_ID}
      aria-live="polite"
      className="space-y-2"
      data-testid="help-sponsor-dashboard-workspace-readiness"
    >
      <header className="space-y-1">
        <h2
          id={HELP_SPONSOR_DASHBOARD_WORKSPACE_READINESS_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {SPONSOR_DASHBOARD_HELP_READINESS_SECTION_TITLE}
        </h2>
        {scopeLine !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{scopeLine}</p>
        ) : null}
      </header>

      <div data-testid="help-sponsor-dashboard-workspace-readiness-status">
        <StatusTag
          kind={readiness.baselineStatusKind}
          label={readiness.baselineStatusLabel}
        />
      </div>
    </section>
  );
}
