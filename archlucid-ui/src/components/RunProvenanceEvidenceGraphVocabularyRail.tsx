"use client";

import type { JSX } from "react";

import {
  buildRunProvenanceEvidenceGraphVocabulary,
  resolveRunProvenanceEvidenceGraphPeerLink,
  type RunProvenanceEvidenceGraphSurfaceId,
  type RunProvenanceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/run-provenance-evidence-graph-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type RunProvenanceEvidenceGraphVocabularyRailProps = {
  readonly currentSurfaceId: RunProvenanceEvidenceGraphSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: RunProvenanceEvidenceGraphVocabularyModel;
};

/** TB-2296 — Per-package provenance walk vs cross-package Evidence graph. */
export function RunProvenanceEvidenceGraphVocabularyRail(
  props: RunProvenanceEvidenceGraphVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildRunProvenanceEvidenceGraphVocabulary();
  const peer = resolveRunProvenanceEvidenceGraphPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "run-provenance"
      ? model.runProvenanceLink
      : model.evidenceGraphLink;

  return (
    <VocabularyRail
      testIdPrefix="run-provenance-evidence-graph-vocabulary"
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
