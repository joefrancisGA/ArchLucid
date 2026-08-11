"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESH,
  REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESHING,
  REPEAT_REVIEW_LOOP_HELP_LAST_REFRESHED_PREFIX,
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

/** Shared `/help/repeat-review-loop` hero — title, lead, contextual help, refresh, export, and last-refreshed metadata. */
export function HelpRepeatReviewLoopPageHeader(
  props: HelpRepeatReviewLoopPageHeaderProps,
): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE}
      titleTestId="help-repeat-review-loop-page-title"
      subtitle={props.subtitle}
      navHref={REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH}
      headingLevel="h1"
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
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-repeat-review-loop-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {REPEAT_REVIEW_LOOP_HELP_LAST_REFRESHED_PREFIX}:{" "}
          {props.refreshing ? REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
