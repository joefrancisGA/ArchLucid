"use client";

import type { JSX } from "react";

import {
  buildRagHealthSystemHealthVocabulary,
  resolveRagHealthSystemHealthPeerLink,
  type RagHealthSystemHealthSurfaceId,
  type RagHealthSystemHealthVocabularyModel,
} from "@/lib/vocabulary/rag-health-system-health-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type RagHealthSystemHealthVocabularyRailProps = {
  /** Surface hosting the strip — marks the current health view and links to the peer. */
  readonly currentSurfaceId: RagHealthSystemHealthSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildRagHealthSystemHealthVocabulary}. */
  readonly model?: RagHealthSystemHealthVocabularyModel;
};

/**
 * TB-2285 — Compact vocabulary rail between RAG corpus health and System health.
 * Mount on both hubs so operators do not conflate corpus indexing with platform probes.
 */
export function RagHealthSystemHealthVocabularyRail(
  props: RagHealthSystemHealthVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildRagHealthSystemHealthVocabulary();
  const peer = resolveRagHealthSystemHealthPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "rag-health" ? model.ragHealthLink : model.systemHealthLink;

  return (
    <VocabularyRail
      testIdPrefix="rag-health-system-health-vocabulary"
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
