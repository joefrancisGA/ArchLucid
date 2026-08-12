"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH } from "@/lib/repeat-review-loop-help-evidence-copy";

export type HelpRepeatReviewLoopPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
};

/** Shared `/help/repeat-review-loop` hero — title, lead, contextual help, and export. */
export function HelpRepeatReviewLoopPageHeader(
  props: HelpRepeatReviewLoopPageHeaderProps,
): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE}
      titleTestId="help-repeat-review-loop-page-title"
      subtitle={props.subtitle}
      navHref={REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH}
      headingLevel="h1"
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="help-repeat-review-loop-breadcrumb"
          items={[
            { label: "Help", href: "/help" },
            { label: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-repeat-review-loop-header-actions">
          <PageContextualHelpButton />
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
    />
  );
}
