"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildScorecardRoiPairwiseRail,
  type ScorecardRoiSurfaceId,
  type ScorecardRoiVocabularyModel,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";

export type ScorecardRoiVocabularyRailProps = {
  readonly currentSurfaceId: ScorecardRoiSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ScorecardRoiVocabularyModel;
};

/**
 * TB-2265 — Compact vocabulary rail between architecture scorecard and ROI summary.
 * Distinct from TB-2258 (ROI summary ≠ sponsor export). Mount on both Insights surfaces.
 */
export function ScorecardRoiVocabularyRail(props: ScorecardRoiVocabularyRailProps): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.scorecardLink,
          peerLink: props.model.roiSummaryLink,
        }
      : buildScorecardRoiPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="scorecard-roi-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
