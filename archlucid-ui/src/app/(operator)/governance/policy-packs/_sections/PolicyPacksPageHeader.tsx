"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
import {
  POLICY_PACKS_ACTION_REFRESH,
  POLICY_PACKS_ACTION_REFRESHING,
  POLICY_PACKS_LAST_REFRESHED_PREFIX,
  POLICY_PACKS_PAGE_TITLE,
} from "@/lib/policy-packs-page";

export type PolicyPacksPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/governance/policy-packs` hero — title, lead, contextual help, and refresh. */
export function PolicyPacksPageHeader(props: PolicyPacksPageHeaderProps): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={POLICY_PACKS_PAGE_TITLE}
      titleTestId="policy-packs-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="policy-packs-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="policy-packs-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? POLICY_PACKS_ACTION_REFRESHING : POLICY_PACKS_ACTION_REFRESH}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="policy-packs-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {POLICY_PACKS_LAST_REFRESHED_PREFIX}:{" "}
          {props.refreshing ? POLICY_PACKS_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
