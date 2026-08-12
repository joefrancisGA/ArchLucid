"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  IMPACT_PREVIEW_ACTION_REFRESH,
  IMPACT_PREVIEW_ACTION_REFRESHING,
  IMPACT_PREVIEW_LAST_REFRESHED_PREFIX,
  IMPACT_PREVIEW_PAGE_TITLE,
} from "@/lib/impact-preview-page-copy";

export type ImpactPreviewPageHeaderProps = {
  readonly subtitle: string;
  readonly listLoading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/insights/impact-preview` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function ImpactPreviewPageHeader(props: ImpactPreviewPageHeaderProps): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={IMPACT_PREVIEW_PAGE_TITLE}
      titleTestId="impact-preview-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="impact-preview-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="impact-preview-refresh-button"
            disabled={props.listLoading}
            onClick={() => void props.onRefresh()}
          >
            {props.listLoading ? IMPACT_PREVIEW_ACTION_REFRESHING : IMPACT_PREVIEW_ACTION_REFRESH}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="impact-preview-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {IMPACT_PREVIEW_LAST_REFRESHED_PREFIX}: {props.listLoading ? IMPACT_PREVIEW_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
