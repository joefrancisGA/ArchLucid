"use client";

import type { ReactNode } from "react";

import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { OPERATOR_HOME_DATA_CURRENCY_PREFIX } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import { useOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";
import {
  OPERATOR_NOT_REFRESHED_LABEL,
  operatorHomeDataCurrencyStaleCue,
  operatorHomeDataCurrencyValue,
} from "@/lib/operator/operator-last-refreshed-label";

export type OperatorHomePageHeaderProps = {
  readonly subtitle?: string;
  readonly workspaceLabel?: string | null;
};

function operatorHomeWorkspaceSubtitle(workspaceLabel: string | null | undefined): ReactNode {
  const trimmed = workspaceLabel?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return (
    <span className="block text-al-text-secondary">
      Summarizing <span className="font-medium text-al-text-primary">{trimmed}</span>.
    </span>
  );
}

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
  const staleCue = operatorHomeDataCurrencyStaleCue(input.lastRefreshedAt);

  return (
    <>
      <span className="text-al-text-secondary">{OPERATOR_HOME_DATA_CURRENCY_PREFIX}: </span>
      <strong className="font-semibold text-al-text-primary">{value}</strong>
      {staleCue !== null ? (
        <span className="ml-1 font-medium text-[var(--al-status-needs-attention-fg)]" data-testid="operator-home-data-stale-cue">
          {staleCue}
        </span>
      ) : null}
    </>
  );
}

/** Shared `/` Overview hero — title, lead, refresh, data-currency timestamp, and resume/start primary. */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, lastRefreshedAt, requestRefresh } = useOperatorHomeRefresh();
  const freshnessTimestamp = refreshing ? null : lastRefreshedAt;
  const freshnessContent = operatorHomeFreshnessContent({
    lastRefreshedAt: freshnessTimestamp,
    refreshing,
  });

  const workspaceSubtitle = operatorHomeWorkspaceSubtitle(props.workspaceLabel);
  const pageSubtitle =
    props.subtitle !== undefined && props.subtitle.length > 0
      ? (
          <>
            {props.subtitle}
            {workspaceSubtitle}
          </>
        )
      : workspaceSubtitle;

  return (
    <OperatorPageHeader
      navHref="/"
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={pageSubtitle}
      subtitleClassName="[&_strong]:font-bold"
      subtitleTestId="operator-home-page-subtitle"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="operator-home-data-currency"
          >
            <OperatorPageFreshnessMetadata
              testId="operator-home-data-currency-label"
              lastRefreshedAt={freshnessTimestamp}
            >
              {freshnessContent}
            </OperatorPageFreshnessMetadata>
            <RefreshButton
              data-testid="operator-home-refresh-button"
              busy={refreshing}
              onClick={() => void requestRefresh()}
            />
          </div>
        </div>
      }
    >
      <OperatorHomeWorkingPrimaryCta variant="primary" />
    </OperatorPageHeader>
  );
}
