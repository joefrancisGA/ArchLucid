"use client";

import type { ReactNode } from "react";

import { OperatorHomeCompactStartingActionsSection } from "@/components/operator-home/OperatorHomeCompactStartingActionsSection";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";

type OperatorHomePageMainContentProps = {
  readonly heroSection: ReactNode;
  readonly recentReviewsSection: ReactNode;
  readonly sponsorRoiStrip: ReactNode;
  readonly firstValueCallout: ReactNode | null;
  readonly examplesPlacement: ReactNode;
};

/** Reorders homepage sections based on live workspace review activity. */
export function OperatorHomePageMainContent(props: OperatorHomePageMainContentProps): React.JSX.Element {
  const { hasWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

  if (hasWorkspaceReviews) {
    return (
      <>
        {props.recentReviewsSection}
        <OperatorHomeCompactStartingActionsSection />
        {props.sponsorRoiStrip}
        {props.examplesPlacement}
      </>
    );
  }

  return (
    <>
      {props.heroSection}
      {props.recentReviewsSection}
      {props.sponsorRoiStrip}
      {props.firstValueCallout}
      {props.examplesPlacement}
    </>
  );
}
