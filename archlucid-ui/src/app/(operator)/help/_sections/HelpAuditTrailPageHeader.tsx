"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUDIT_TRAIL_HELP_ACTION_REFRESH,
  AUDIT_TRAIL_HELP_ACTION_REFRESHING,
  AUDIT_TRAIL_HELP_LAST_REFRESHED_PREFIX,
  AUDIT_TRAIL_HELP_PAGE_TITLE,
} from "@/lib/audit-trail-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpAuditTrailPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/help/audit-trail` hero — title, lead, contextual help, refresh, export, and last-refreshed metadata. */
export function HelpAuditTrailPageHeader(props: HelpAuditTrailPageHeaderProps): React.JSX.Element {
  const lastRefreshedLabel =
    props.lastRefreshedAt === null ? "Not refreshed yet" : props.lastRefreshedAt.toLocaleString();

  return (
    <OperatorPageHeader
      title={AUDIT_TRAIL_HELP_PAGE_TITLE}
      titleTestId="help-audit-trail-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-audit-trail-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="help-audit-trail-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? AUDIT_TRAIL_HELP_ACTION_REFRESHING : AUDIT_TRAIL_HELP_ACTION_REFRESH}
          </Button>
          <HelpTopicPdfDownloadButton entry={props.entry} />
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-audit-trail-last-refreshed"
        >
          {AUDIT_TRAIL_HELP_LAST_REFRESHED_PREFIX}:{" "}
          {props.refreshing ? AUDIT_TRAIL_HELP_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
