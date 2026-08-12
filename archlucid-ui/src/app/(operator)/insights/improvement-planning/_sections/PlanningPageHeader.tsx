"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import {
  IMPROVEMENT_PLANNING_LAST_UPDATED_PREFIX,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_REFRESH_LABEL,
  IMPROVEMENT_PLANNING_REFRESHING_LABEL,
} from "@/lib/planning-page-copy";

export type PlanningPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly generatedUtc: string | null;
  readonly onRefresh: () => void;
};

/** Shared `/planning` hero — title, lead, contextual help, and refresh in the first viewport. */
export function PlanningPageHeader(props: PlanningPageHeaderProps): React.JSX.Element {
  const lastUpdatedLabel =
    props.generatedUtc === null ? "—" : formatIsoUtcForDisplay(props.generatedUtc);

  return (
    <OperatorPageHeader
      title={IMPROVEMENT_PLANNING_PAGE_TITLE}
      titleTestId="planning-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="planning-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="planning-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? IMPROVEMENT_PLANNING_REFRESHING_LABEL : IMPROVEMENT_PLANNING_REFRESH_LABEL}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="planning-last-updated"
        >
          {IMPROVEMENT_PLANNING_LAST_UPDATED_PREFIX}{" "}
          {props.refreshing ? IMPROVEMENT_PLANNING_REFRESHING_LABEL : lastUpdatedLabel}
        </span>
      }
    />
  );
}
