"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAskArchitectureIntelligencePairwiseRail,
  type AskArchitectureIntelligenceSurfaceId,
  type AskArchitectureIntelligenceVocabularyModel,
} from "@/lib/vocabulary/ask-architecture-intelligence-vocabulary";

export type AskArchitectureIntelligenceVocabularyRailProps = {
  readonly currentSurfaceId: AskArchitectureIntelligenceSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AskArchitectureIntelligenceVocabularyModel;
};

/** TB-2313 — Ask review questions vs Architecture intelligence. */
export function AskArchitectureIntelligenceVocabularyRail(
  props: AskArchitectureIntelligenceVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.askReviewQuestionsLink,
          peerLink: props.model.architectureIntelligenceLink,
        }
      : buildAskArchitectureIntelligencePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="ask-architecture-intelligence-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
