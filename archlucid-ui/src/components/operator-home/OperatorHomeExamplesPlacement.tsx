"use client";

import type { ReactNode } from "react";

import { OperatorHomeExploreSampleSection } from "@/components/operator-home/OperatorHomeExploreSampleSection";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useSampleReviewsOnOverviewVisible } from "@/components/SampleReviewsOnOverviewPreferenceProvider";

type OperatorHomeExamplesPlacementProps = {
  readonly beforeWorkspaceContext: ReactNode;
  readonly afterWorkspaceContext: ReactNode;
};

/** Places examples prominently for empty workspaces and lower when reviews exist. */
export function OperatorHomeExamplesPlacement(props: OperatorHomeExamplesPlacementProps): React.JSX.Element {
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();
  const { hasWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

  return (
    <>
      {props.beforeWorkspaceContext}
      {sampleReviewsVisible && !hasWorkspaceReviews ? <OperatorHomeExploreSampleSection /> : null}
      {props.afterWorkspaceContext}
      {sampleReviewsVisible && hasWorkspaceReviews ? <OperatorHomeExploreSampleSection /> : null}
    </>
  );
}
