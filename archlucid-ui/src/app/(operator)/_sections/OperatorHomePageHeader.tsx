"use client";

import type { ReactNode } from "react";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL,
} from "@/lib/buyer-polish-copy";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
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

function operatorHomeSubtitleContent(subtitle: string): ReactNode {
  if (subtitle !== OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO) {
    return subtitle;
  }

  return (
    <>
      <strong className="font-bold text-al-text-primary">
        {OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL}
      </strong>{" "}
      {OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY}
    </>
  );
}

/** Shared `/` Overview hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useOperatorHomeRefresh();
  const lastRefreshedLabel = operatorLastRefreshedLabel(lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={operatorHomeSubtitleContent(props.subtitle)}
      subtitleClassName="max-w-none [&_strong]:font-bold"
      subtitleTestId="operator-home-page-subtitle"
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
          className="text-al-text-secondary [&_strong]:font-bold"
          data-testid="operator-home-last-refreshed"
          title={operatorLastRefreshedExactLabel(lastRefreshedAt)}
        >
          <strong className="font-bold text-al-text-primary">
            {OPERATOR_HOME_LAST_REFRESHED_PREFIX}:
          </strong>{" "}
          {refreshing ? OPERATOR_HOME_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
