import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA,
  IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_HREF,
  IMPROVEMENT_PLANNING_EMPTY_DESCRIPTION,
  IMPROVEMENT_PLANNING_EMPTY_TITLE,
  IMPROVEMENT_PLANNING_VIEW_REVIEWS_CTA,
  IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
} from "@/lib/planning-page-copy";

import { PlanningEmptyOrientationStrip } from "./PlanningEmptyOrientationStrip";

/** Guided empty state when no themes or plans exist for the current workspace. */
export function PlanningPageEmptyState(): React.JSX.Element {
  return (
    <div className="mt-4 space-y-1" data-testid="planning-empty-composition">
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
            label: IMPROVEMENT_PLANNING_VIEW_REVIEWS_CTA,
            href: IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
            variant: "outline",
          },
        ]}
      />
      <PlanningEmptyOrientationStrip />
    </div>
  );
}
