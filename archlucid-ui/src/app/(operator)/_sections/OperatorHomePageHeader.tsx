"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_ACTION_REFRESH,
  OPERATOR_HOME_ACTION_REFRESHING,
  OPERATOR_HOME_LAST_REFRESHED_PREFIX,
  OPERATOR_HOME_PAGE_TITLE,
} from "@/lib/operator-home-page-copy";
import { useOperatorHomeRefresh } from "@/lib/operator-home-refresh-context";

export type OperatorHomePageHeaderProps = {
  readonly subtitle: string;
};

/** Shared `/` Overview hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useOperatorHomeRefresh();
  const lastRefreshedLabel =
    lastRefreshedAt === null ? "Not refreshed yet" : lastRefreshedAt.toLocaleString();

  return (
    <OperatorPageHeader
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="operator-home-refresh-button"
            disabled={refreshing}
            onClick={() => void requestRefresh()}
          >
            {refreshing ? OPERATOR_HOME_ACTION_REFRESHING : OPERATOR_HOME_ACTION_REFRESH}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="operator-home-last-refreshed"
        >
          {OPERATOR_HOME_LAST_REFRESHED_PREFIX}:{" "}
          {refreshing ? OPERATOR_HOME_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
