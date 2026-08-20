"use client";

import type { JSX } from "react";

import {
  buildFindingsQueueSearchEvidenceVocabulary,
  resolveFindingsQueueSearchEvidencePeerLink,
  type FindingsQueueSearchEvidenceSurfaceId,
  type FindingsQueueSearchEvidenceVocabularyModel,
} from "@/lib/vocabulary/findings-queue-search-evidence-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type FindingsQueueSearchEvidenceVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: FindingsQueueSearchEvidenceSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildFindingsQueueSearchEvidenceVocabulary}. */
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
  const model = props.model ?? buildFindingsQueueSearchEvidenceVocabulary();
  const peer = resolveFindingsQueueSearchEvidencePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "findings-queue"
      ? model.findingsQueueLink
      : model.searchEvidenceLink;

  return (
    <VocabularyRail
      testIdPrefix="findings-queue-search-evidence-vocabulary"
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
