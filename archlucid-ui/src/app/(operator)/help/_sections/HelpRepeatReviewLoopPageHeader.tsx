"use client";

import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESH,
  REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESHING,
  REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
} from "@/lib/repeat-review-loop-help-guide-content";
import { REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH } from "@/lib/repeat-review-loop-help-evidence-copy";

export type HelpRepeatReviewLoopPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/help/repeat-review-loop` hero — title, lead, contextual help, refresh, and export. */
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="help-repeat-review-loop-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESHING : REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESH}
          </Button>
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
    />
  );
}
