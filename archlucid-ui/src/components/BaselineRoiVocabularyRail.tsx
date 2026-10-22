"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildBaselineRoiPairwiseRail,
  type BaselineRoiSurfaceId,
  type BaselineRoiVocabularyModel,
} from "@/lib/vocabulary/baseline-roi-vocabulary";

export type BaselineRoiVocabularyRailProps = {
  readonly currentSurfaceId: BaselineRoiSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: BaselineRoiVocabularyModel;
};

/**
 * TB-2275 — Compact vocabulary rail between baseline settings and ROI summary.
 * Distinct from TB-2265 (scorecard ≠ ROI) and TB-2258 (ROI ≠ sponsor export).
 */
export function BaselineRoiVocabularyRail(props: BaselineRoiVocabularyRailProps): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.baselineLink,
          peerLink: props.model.roiSummaryLink,
        }
      : buildBaselineRoiPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="baseline-roi-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
