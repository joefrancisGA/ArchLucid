"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAskSearchEvidencePairwiseRail,
  type AskSearchEvidenceSurfaceId,
  type AskSearchEvidenceVocabularyModel,
} from "@/lib/vocabulary/ask-search-evidence-vocabulary";

export type AskSearchEvidenceVocabularyRailProps = {
  readonly currentSurfaceId: AskSearchEvidenceSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AskSearchEvidenceVocabularyModel;
};

/**
 * TB-2231 — Compact vocabulary rail between Ask review questions and Search review evidence.
 * Mount on both hubs so operators do not conflate Q&A citations with cross-package retrieval.
 */
export function AskSearchEvidenceVocabularyRail(
  props: AskSearchEvidenceVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.askLink,
          peerLink: props.model.searchLink,
        }
      : buildAskSearchEvidencePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="ask-search-evidence-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
