"use client";

import type { JSX } from "react";

import {
  buildArchitectureIntelligenceEvidenceGraphVocabulary,
  resolveArchitectureIntelligenceEvidenceGraphPeerLink,
  type ArchitectureIntelligenceEvidenceGraphSurfaceId,
  type ArchitectureIntelligenceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/architecture-intelligence-evidence-graph-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildArchitectureIntelligenceEvidenceGraphVocabulary();
  const peer = resolveArchitectureIntelligenceEvidenceGraphPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "architecture-intelligence"
      ? model.architectureIntelligenceLink
      : model.evidenceGraphLink;

  return (
    <VocabularyRail
      testIdPrefix="architecture-intelligence-evidence-graph-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
