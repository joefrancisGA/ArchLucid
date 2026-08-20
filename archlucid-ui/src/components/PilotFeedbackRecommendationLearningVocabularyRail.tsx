"use client";

import type { JSX } from "react";

import {
  buildPilotFeedbackRecommendationLearningVocabulary,
  resolvePilotFeedbackRecommendationLearningPeerLink,
  type PilotFeedbackRecommendationLearningSurfaceId,
  type PilotFeedbackRecommendationLearningVocabularyModel,
} from "@/lib/vocabulary/pilot-feedback-recommendation-learning-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildPilotFeedbackRecommendationLearningVocabulary();
  const peer = resolvePilotFeedbackRecommendationLearningPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "pilot-feedback"
      ? model.pilotFeedbackLink
      : model.recommendationLearningLink;

  return (
    <VocabularyRail
      testIdPrefix="pilot-feedback-recommendation-learning-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
