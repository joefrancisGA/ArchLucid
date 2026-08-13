"use client";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { HealthFreshnessLabel } from "@/components/health-dashboard/HealthDashboardSections";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { SYSTEM_HEALTH_PAGE_TITLE, SYSTEM_HEALTH_REFRESH_POLICY } from "@/lib/system-health-page-copy";

export type SystemHealthPageHeaderProps = {
  readonly subtitle: string;
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly refreshTestId?: string;
};

/** Shared System health hero — title, lead, contextual help, and refresh in the first viewport. */
export function SystemHealthPageHeader(props: SystemHealthPageHeaderProps): React.JSX.Element {
  const refreshTestId = props.refreshTestId ?? "system-health-refresh";

  return (
    <OperatorPageHeader
      navHref={ADMINISTRATION_SYSTEM_HEALTH_PATH}
      title={SYSTEM_HEALTH_PAGE_TITLE}
      titleTestId="system-health-page-title"
      subtitle={props.subtitle}
      actions={
        // Freshness sits with the control that changes it — a stamp stranded across the
        // header cannot be read as state belonging to Refresh.
        <div className="flex flex-wrap items-center gap-2" data-testid="system-health-header-actions">
          <PageContextualHelpButton />
          <HealthFreshnessLabel
            loading={props.loading}
            lastRefreshedAt={props.lastRefreshedAt}
            refreshPolicy={SYSTEM_HEALTH_REFRESH_POLICY}
            testId="system-health-refresh-timestamp"
          />
          <RefreshButton
            busy={props.loading}
            data-testid={refreshTestId}
            onClick={() => void props.onRefresh()}
          />
        </div>
      }
    />
  );
}
