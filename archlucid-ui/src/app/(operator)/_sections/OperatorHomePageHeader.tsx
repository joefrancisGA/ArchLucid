"use client";

import type { ReactNode } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_HOME_DATA_CURRENCY_PREFIX,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import { useOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";
import {
  OPERATOR_NOT_REFRESHED_LABEL,
  operatorHomeDataCurrencyValue,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";

export type OperatorHomePageHeaderProps = {
  readonly subtitle: string;
};

function operatorHomeFreshnessContent(input: {
  readonly lastRefreshedAt: Date | null | undefined;
  readonly refreshing: boolean;
}): ReactNode {
  if (input.refreshing) {
    return "Refreshing…";
  }

  if (input.lastRefreshedAt === null || input.lastRefreshedAt === undefined) {
    return OPERATOR_NOT_REFRESHED_LABEL;
  }

  const value = operatorHomeDataCurrencyValue(input.lastRefreshedAt);

  return (
    <>
      <span className="text-al-text-secondary">{OPERATOR_HOME_DATA_CURRENCY_PREFIX}: </span>
      <strong className="font-semibold text-al-text-primary">{value}</strong>
    </>
  );
}

/** Shared `/` Overview hero — title, lead, contextual help, refresh, and data-currency timestamp. */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useOperatorHomeRefresh();
  const freshnessContent = operatorHomeFreshnessContent({
    lastRefreshedAt: refreshing ? null : lastRefreshedAt,
    refreshing,
  });

  return (
    <OperatorPageHeader
      navHref="/"
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={props.subtitle}
      subtitleClassName="[&_strong]:font-bold"
      subtitleTestId="operator-home-page-subtitle"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          <OperatorPageFreshnessMetadata
            testId="operator-home-data-currency"
            lastRefreshedAt={refreshing ? null : lastRefreshedAt}
          >
            {freshnessContent}
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
