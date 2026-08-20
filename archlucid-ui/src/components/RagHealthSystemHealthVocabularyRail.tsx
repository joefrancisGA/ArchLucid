"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildRagHealthSystemHealthPairwiseRail,
  type RagHealthSystemHealthSurfaceId,
  type RagHealthSystemHealthVocabularyModel,
} from "@/lib/vocabulary/rag-health-system-health-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.ragHealthLink,
          peerLink: props.model.systemHealthLink,
        }
      : buildRagHealthSystemHealthPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="rag-health-system-health-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
