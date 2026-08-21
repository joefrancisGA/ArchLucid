"use client";

import type { ReactNode } from "react";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL,
  OPERATOR_HOME_DATA_CURRENCY_PREFIX,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import { useOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";

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

/** Shared `/` Overview hero — title, lead, contextual help, refresh, and data-currency timestamp. */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useOperatorHomeRefresh();
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: OPERATOR_HOME_DATA_CURRENCY_PREFIX,
    lastRefreshedAt: refreshing ? null : lastRefreshedAt,
    refreshingLabel: refreshing ? "Refreshing…" : null,
  });

  return (
    <OperatorPageHeader
      navHref="/"
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={operatorHomeSubtitleContent(props.subtitle)}
      subtitleClassName="[&_strong]:font-bold"
      subtitleTestId="operator-home-page-subtitle"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          <OperatorPageFreshnessMetadata
            testId="operator-home-data-currency"
            lastRefreshedAt={refreshing ? null : lastRefreshedAt}
          >
            {freshnessLabel}
          </OperatorPageFreshnessMetadata>
          <RefreshButton
            data-testid="operator-home-refresh-button"
            busy={refreshing}
            onClick={() => void requestRefresh()}
          />
        </div>
      }
    />
  );
}
