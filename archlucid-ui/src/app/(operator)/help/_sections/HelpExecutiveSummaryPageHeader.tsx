"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXECUTIVE_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/executive-summary-help-guide-content";
import { EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/executive-summary-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpExecutiveSummaryPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
};

/** Shared `/help/executive-summary` hero — title, lead, contextual help, export, and document provenance. */
export function HelpExecutiveSummaryPageHeader(
  props: HelpExecutiveSummaryPageHeaderProps,
): React.JSX.Element {
  const sourceDocPath = props.entry.sourcePaths[0] ?? "";

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
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
      metadata={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="help-executive-summary-provenance">
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
            data-testid="help-executive-summary-source-of-record"
          >
            Source of record: {sourceDocPath}
          </span>
        </div>
      }
    />
  );
}
