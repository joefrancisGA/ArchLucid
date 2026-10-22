"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildArchitectureIntelligenceEvidenceGraphPairwiseRail,
  type ArchitectureIntelligenceEvidenceGraphSurfaceId,
  type ArchitectureIntelligenceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/architecture-intelligence-evidence-graph-vocabulary";

export type ArchitectureIntelligenceEvidenceGraphVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ArchitectureIntelligenceEvidenceGraphSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildArchitectureIntelligenceEvidenceGraphVocabulary}. */
  readonly model?: ArchitectureIntelligenceEvidenceGraphVocabularyModel;
};

/**
 * TB-2273 — Compact vocabulary rail between Architecture intelligence and Evidence graph.
 * Mount on both hubs. Distinct from EvidenceGraphFirstOpenCoach (TB-2244).
 */
export function ArchitectureIntelligenceEvidenceGraphVocabularyRail(
  props: ArchitectureIntelligenceEvidenceGraphVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.architectureIntelligenceLink,
          peerLink: props.model.evidenceGraphLink,
        }
      : buildArchitectureIntelligenceEvidenceGraphPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="architecture-intelligence-evidence-graph-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
