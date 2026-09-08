"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  REVIEW_WORKSPACE_FOLLOW_UPS_TITLE,
  REVIEW_WORKSPACE_SOURCES_INTRO,
  buildReviewWorkspaceSources,
} from "@/lib/review-workspace-evidence-copy";

export type RunDetailClaimOrientationStripProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Sources index for the review workspace detail route (RRE). */
export function RunDetailClaimOrientationStrip(
  props: RunDetailClaimOrientationStripProps,
): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="review-detail"
      stripTestId="review-detail-orientation"
      sourcesTestId="review-detail-sources"
      sourcesTitle={REVIEW_WORKSPACE_FOLLOW_UPS_TITLE}
      sourcesIntro={REVIEW_WORKSPACE_SOURCES_INTRO}
      sources={buildReviewWorkspaceSources(props.runId, props.architectureId, { workingMode: isWorkingMode })}
      hubSecondary
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
