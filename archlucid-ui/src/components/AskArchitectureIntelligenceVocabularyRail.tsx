"use client";

import type { JSX } from "react";

import {
  buildAskArchitectureIntelligenceVocabulary,
  resolveAskArchitectureIntelligencePeerLink,
  type AskArchitectureIntelligenceSurfaceId,
  type AskArchitectureIntelligenceVocabularyModel,
} from "@/lib/vocabulary/ask-architecture-intelligence-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildAskArchitectureIntelligenceVocabulary();
  const peer = resolveAskArchitectureIntelligencePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "ask-review-questions"
      ? model.askReviewQuestionsLink
      : model.architectureIntelligenceLink;

  return (
    <VocabularyRail
      testIdPrefix="ask-architecture-intelligence-vocabulary"
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
