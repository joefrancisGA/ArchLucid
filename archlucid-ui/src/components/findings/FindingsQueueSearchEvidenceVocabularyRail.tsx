"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildFindingsQueueSearchEvidencePairwiseRail,
  type FindingsQueueSearchEvidenceSurfaceId,
  type FindingsQueueSearchEvidenceVocabularyModel,
} from "@/lib/vocabulary/findings-queue-search-evidence-vocabulary";

export type FindingsQueueSearchEvidenceVocabularyRailProps = {
  readonly currentSurfaceId: FindingsQueueSearchEvidenceSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: FindingsQueueSearchEvidenceVocabularyModel;
};

/**
 * TB-2261 — Compact vocabulary rail between Findings queue and Search review evidence.
 * Mount on both hubs so operators do not conflate triage with cross-package retrieval.
 * Distinct from Ask ↔ Search (TB-2231).
 */
export function FindingsQueueSearchEvidenceVocabularyRail(
  props: FindingsQueueSearchEvidenceVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.findingsQueueLink,
          peerLink: props.model.searchEvidenceLink,
        }
      : buildFindingsQueueSearchEvidencePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="findings-queue-search-evidence-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
