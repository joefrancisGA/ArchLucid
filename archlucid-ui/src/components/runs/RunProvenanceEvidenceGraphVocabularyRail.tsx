"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildRunProvenanceEvidenceGraphPairwiseRail,
  type RunProvenanceEvidenceGraphSurfaceId,
  type RunProvenanceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/run-provenance-evidence-graph-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.runProvenanceLink,
          externalPeerLink: props.model.evidenceGraphLink,
        }
      : buildRunProvenanceEvidenceGraphPairwiseRail();

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="run-provenance-evidence-graph-vocabulary"
      reviewSurfaceId="run-provenance"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
