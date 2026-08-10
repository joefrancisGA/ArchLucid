"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
import {
  EXECUTIVE_SUMMARY_HELP_ACTION_REFRESH,
  EXECUTIVE_SUMMARY_HELP_ACTION_REFRESHING,
  EXECUTIVE_SUMMARY_HELP_LAST_REFRESHED_PREFIX,
  EXECUTIVE_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/executive-summary-help-guide-content";
import { EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/executive-summary-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpExecutiveSummaryPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/help/executive-summary` hero — title, lead, contextual help, refresh, export, and last-refreshed metadata. */
export function HelpExecutiveSummaryPageHeader(
  props: HelpExecutiveSummaryPageHeaderProps,
): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={EXECUTIVE_SUMMARY_HELP_PAGE_TITLE}
      titleTestId="help-executive-summary-page-title"
      subtitle={props.subtitle}
      navHref={EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH}
      headingLevel="h1"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-executive-summary-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="help-executive-summary-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? EXECUTIVE_SUMMARY_HELP_ACTION_REFRESHING : EXECUTIVE_SUMMARY_HELP_ACTION_REFRESH}
          </Button>
          <HelpTopicPdfDownloadButton entry={props.entry} />
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-executive-summary-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {EXECUTIVE_SUMMARY_HELP_LAST_REFRESHED_PREFIX}:{" "}
          {props.refreshing ? EXECUTIVE_SUMMARY_HELP_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
