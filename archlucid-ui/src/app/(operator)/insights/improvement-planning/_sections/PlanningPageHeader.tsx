"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
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
          <RefreshButton
            busy={props.refreshing}
            label={IMPROVEMENT_PLANNING_REFRESH_LABEL}
            data-testid="planning-refresh-button"
            onClick={() => void props.onRefresh()}
          />
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
