"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  POLICY_PACKS_ACTION_REFRESH,
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
};

/** Shared `/governance/policy-packs` hero — title, lead, contextual help, refresh, and resolution shortcut. */
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
          <Link
            href={POLICY_PACKS_RESOLUTION_LINK_HREF}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="policy-packs-resolution-link"
          >
            {POLICY_PACKS_RESOLUTION_LINK_LABEL}
          </Link>
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
