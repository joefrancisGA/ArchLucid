"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  SPONSOR_SUMMARY_HELP_PAGE_TITLE,
} from "@/lib/sponsor-report-help-guide-content";
import { SPONSOR_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/sponsor-report-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpSponsorSummaryPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
};

/** Shared `/help/sponsor-report` hero — title, lead, contextual help, and export. */
export function HelpSponsorSummaryPageHeader(
  props: HelpSponsorSummaryPageHeaderProps,
): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={SPONSOR_SUMMARY_HELP_PAGE_TITLE}
      titleTestId="help-sponsor-report-page-title"
      subtitle={props.subtitle}
      navHref={SPONSOR_SUMMARY_HELP_CANONICAL_PATH}
      headingLevel="h1"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-sponsor-report-header-actions">
          <PageContextualHelpButton />
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
    />
  );
}
