"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildPackageEvidenceEvidenceGraphPairwiseRail,
  type PackageEvidenceEvidenceGraphSurfaceId,
  type PackageEvidenceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/package-evidence-evidence-graph-vocabulary";

export type PackageEvidenceEvidenceGraphVocabularyRailProps = {
  readonly currentSurfaceId: PackageEvidenceEvidenceGraphSurfaceId;
  /** Required on package Evidence tabs so the current link is run-scoped. */
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PackageEvidenceEvidenceGraphVocabularyModel;
};

/** TB-2300 — Package Evidence capture/inventory vs Evidence graph explorer. */
export function PackageEvidenceEvidenceGraphVocabularyRail(
  props: PackageEvidenceEvidenceGraphVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.packageEvidenceLink,
          externalPeerLink: props.model.evidenceGraphLink,
        }
      : buildPackageEvidenceEvidenceGraphPairwiseRail(props.runId);

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="package-evidence-evidence-graph-vocabulary"
      reviewSurfaceId="package-evidence"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
