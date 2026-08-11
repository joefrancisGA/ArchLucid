"use client";

import type { JSX } from "react";

import {
  buildAskSearchEvidenceVocabulary,
  resolveAskSearchEvidencePeerLink,
  type AskSearchEvidenceSurfaceId,
  type AskSearchEvidenceVocabularyModel,
} from "@/lib/vocabulary/ask-search-evidence-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type AskSearchEvidenceVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: AskSearchEvidenceSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAskSearchEvidenceVocabulary}. */
  readonly model?: AskSearchEvidenceVocabularyModel;
};

/**
 * TB-2231 — Compact vocabulary rail between Ask review questions and Search review evidence.
 * Mount on both hubs so operators do not conflate Q&A citations with cross-package retrieval.
 */
export function AskSearchEvidenceVocabularyRail(
  props: AskSearchEvidenceVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildAskSearchEvidenceVocabulary();
  const peer = resolveAskSearchEvidencePeerLink(props.currentSurfaceId);
  const currentLink = props.currentSurfaceId === "ask" ? model.askLink : model.searchLink;

  return (
    <VocabularyRail
      testIdPrefix="ask-search-evidence-vocabulary"
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
