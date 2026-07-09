import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA,
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_HREF,
  IMPROVEMENT_PLANNING_EMPTY_DESCRIPTION,
  IMPROVEMENT_PLANNING_EMPTY_TITLE,
  IMPROVEMENT_PLANNING_RUN_PILOT_FEEDBACK_CTA,
  IMPROVEMENT_PLANNING_VIEW_REVIEWS_CTA,
  IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
} from "@/lib/planning-page-copy";

/** Guided empty state when no themes or plans exist for the current workspace. */
export function PlanningPageEmptyState(): React.JSX.Element {
  return (
    <EnterpriseCompactEmptyState
      testId="planning-empty-state"
      title={IMPROVEMENT_PLANNING_EMPTY_TITLE}
      description={IMPROVEMENT_PLANNING_EMPTY_DESCRIPTION}
      actions={[
        {
          label: IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA,
          href: IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_HREF,
          variant: "primary",
        },
        {
          label: IMPROVEMENT_PLANNING_RUN_PILOT_FEEDBACK_CTA,
          href: IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_HREF,
          variant: "outline",
        },
        {
          label: IMPROVEMENT_PLANNING_VIEW_REVIEWS_CTA,
          href: IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
          variant: "outline",
        },
      ]}
    />
  );
}
