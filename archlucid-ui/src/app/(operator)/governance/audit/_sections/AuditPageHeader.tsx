"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  AUDIT_TRAIL_LAST_UPDATED_PREFIX,
  AUDIT_TRAIL_REFRESHING_ACTION,
} from "@/lib/audit-trail-page-copy";

export type AuditPageHeaderProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly searching: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly metadata?: ReactNode;
  readonly actions?: ReactNode;
};

/** Shared `/governance/audit` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function AuditPageHeader(props: AuditPageHeaderProps): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      navHref={GOVERNANCE_AUDIT_PATH}
      title={props.title}
      titleTestId="audit-page-title"
      subtitle={props.subtitle}
      metadata={
        <>
          {props.metadata}
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="audit-last-refreshed"
            title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
          >
            {AUDIT_TRAIL_LAST_UPDATED_PREFIX}: {props.searching ? AUDIT_TRAIL_REFRESHING_ACTION : lastRefreshedLabel}
          </span>
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="audit-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            busy={props.searching}
            onClick={() => void props.onRefresh()}
            data-testid="audit-header-refresh-button"
          />
          {props.actions}
        </div>
      }
    />
  );
}
