"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPilotFeedbackRecommendationLearningPairwiseRail,
  type PilotFeedbackRecommendationLearningSurfaceId,
  type PilotFeedbackRecommendationLearningVocabularyModel,
} from "@/lib/vocabulary/pilot-feedback-recommendation-learning-vocabulary";

export type PilotFeedbackRecommendationLearningVocabularyRailProps = {
  readonly currentSurfaceId: PilotFeedbackRecommendationLearningSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PilotFeedbackRecommendationLearningVocabularyModel;
};

/** TB-2307 — Pilot feedback themes vs Recommendation learning ranking weights. */
export function PilotFeedbackRecommendationLearningVocabularyRail(
  props: PilotFeedbackRecommendationLearningVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.pilotFeedbackLink,
          peerLink: props.model.recommendationLearningLink,
        }
      : buildPilotFeedbackRecommendationLearningPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="pilot-feedback-recommendation-learning-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
