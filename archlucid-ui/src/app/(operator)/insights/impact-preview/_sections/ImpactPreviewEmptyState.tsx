"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";
import {
  IMPACT_PREVIEW_ACTION_CREATE_PROPOSED_CHANGE,
  IMPACT_PREVIEW_ACTION_OPEN_PLANNING,
  IMPACT_PREVIEW_ACTION_OPEN_REVIEW_PACKAGES,
  IMPACT_PREVIEW_ACTION_REQUEST_ACCESS,
  IMPACT_PREVIEW_CREATE_REVIEW_HREF,
  IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_BODY,
  IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_TITLE,
  IMPACT_PREVIEW_EMPTY_PERMISSION_BODY,
  IMPACT_PREVIEW_EMPTY_PERMISSION_TITLE,
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_REVIEWS_HREF,
  IMPACT_PREVIEW_SETTINGS_ROLES_HREF,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";

export type ImpactPreviewEmptyStateProps = {
  readonly pageState: ImpactPreviewPageState;
  readonly planningReachable: boolean;
};

export function ImpactPreviewEmptyState(props: ImpactPreviewEmptyStateProps): React.JSX.Element | null {
  if (props.pageState === "ready") {
    return null;
  }

  if (props.pageState === "permission_denied") {
    return (
      <EnterpriseCompactEmptyState
        testId="impact-preview-permission-empty-state"
        title={IMPACT_PREVIEW_EMPTY_PERMISSION_TITLE}
        description={IMPACT_PREVIEW_EMPTY_PERMISSION_BODY}
        prominentBoundary
        role="alert"
        actions={[
          { label: IMPACT_PREVIEW_ACTION_REQUEST_ACCESS, href: IMPACT_PREVIEW_SETTINGS_ROLES_HREF, variant: "primary" },
        ]}
      />
    );
  }

  if (props.pageState === "no_baseline") {
    const prerequisiteEmpty = buildInsightsFinalizedReviewPrerequisiteEmpty({
      jobId: "impact-preview",
      finalizedCount: 0,
    });

    return (
      <EnterpriseCompactEmptyState
        {...prerequisiteEmpty}
        prominentBoundary
      />
    );
  }

  const createHref = props.planningReachable ? IMPACT_PREVIEW_PLANNING_HREF : IMPACT_PREVIEW_CREATE_REVIEW_HREF;
  const secondaryActions = props.planningReachable
    ? [
        { label: IMPACT_PREVIEW_ACTION_OPEN_REVIEW_PACKAGES, href: IMPACT_PREVIEW_REVIEWS_HREF, variant: "outline" as const },
        { label: IMPACT_PREVIEW_ACTION_OPEN_PLANNING, href: IMPACT_PREVIEW_PLANNING_HREF, variant: "outline" as const },
      ]
    : [{ label: IMPACT_PREVIEW_ACTION_OPEN_REVIEW_PACKAGES, href: IMPACT_PREVIEW_REVIEWS_HREF, variant: "outline" as const }];

  return (
    <EnterpriseCompactEmptyState
      testId="impact-preview-no-candidates-empty-state"
      title={IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_TITLE}
      description={IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_BODY}
      prominentBoundary
      actions={[
        { label: IMPACT_PREVIEW_ACTION_CREATE_PROPOSED_CHANGE, href: createHref, variant: "primary" },
        ...secondaryActions,
      ]}
    />
  );
}
