"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  EXECUTIVE_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/executive-summary-help-guide-content";
import { EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/executive-summary-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpExecutiveSummaryPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
};

/** Shared `/help/executive-summary` hero — title, lead, contextual help, and export. */
export function HelpExecutiveSummaryPageHeader(
  props: HelpExecutiveSummaryPageHeaderProps,
): React.JSX.Element {
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
    />
  );
}
