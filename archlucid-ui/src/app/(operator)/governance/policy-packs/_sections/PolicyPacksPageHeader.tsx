"use client";

import Link from "next/link";

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import {
  POLICY_PACKS_ACTION_REFRESHING,
  POLICY_PACKS_LAST_REFRESHED_PREFIX,
  POLICY_PACKS_PAGE_TITLE,
  POLICY_PACKS_RESOLUTION_LINK_HREF,
  POLICY_PACKS_RESOLUTION_LINK_LABEL,
} from "@/lib/policy/policy-packs-page";

export type PolicyPacksPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly breadcrumb?: React.ReactNode;
};

/** Shared `/governance/policy-packs` hero — title, lead, contextual help, refresh, and resolution shortcut. */
export function PolicyPacksPageHeader(props: PolicyPacksPageHeaderProps): React.JSX.Element {
  const freshnessLabel = props.refreshing
    ? POLICY_PACKS_ACTION_REFRESHING
    : operatorFreshnessMetadataWithClockLabel({
        prefix: POLICY_PACKS_LAST_REFRESHED_PREFIX,
        lastRefreshedAt: props.lastRefreshedAt,
        refreshingLabel: null,
      });

  return (
    <OperatorPageHeader
      navHref={GOVERNANCE_POLICY_PACKS_PATH}
      title={POLICY_PACKS_PAGE_TITLE}
      titleTestId="policy-packs-page-title"
      subtitle={props.subtitle}
      breadcrumb={props.breadcrumb}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="policy-packs-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            data-testid="policy-packs-refresh-button"
            busy={props.refreshing}
            onClick={() => void props.onRefresh()}
          />
          <Link
            href={POLICY_PACKS_RESOLUTION_LINK_HREF}
            className={OPERATOR_LINK.optional}
            data-testid="policy-packs-resolution-link"
          >
            {POLICY_PACKS_RESOLUTION_LINK_LABEL}
          </Link>
        </div>
      }
      metadata={
        <OperatorPageFreshnessMetadata
          testId="policy-packs-last-refreshed"
          lastRefreshedAt={props.refreshing ? null : props.lastRefreshedAt}
        >
          {freshnessLabel}
        </OperatorPageFreshnessMetadata>
      }
    />
  );
}
