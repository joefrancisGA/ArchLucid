"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SYSTEM_HEALTH_PAGE_TITLE } from "@/lib/system-health-page-copy";

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
  const lastRefreshedLabel =
    props.lastRefreshedAt === null ? "Not refreshed yet" : props.lastRefreshedAt.toLocaleString();

  return (
    <OperatorPageHeader
      title={SYSTEM_HEALTH_PAGE_TITLE}
      titleTestId="system-health-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="system-health-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid={refreshTestId}
            disabled={props.loading}
            onClick={() => void props.onRefresh()}
          >
            {props.loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="system-health-refresh-timestamp"
        >
          Last refreshed: {props.loading ? "Refreshing…" : lastRefreshedLabel}
        </span>
      }
    />
  );
}
