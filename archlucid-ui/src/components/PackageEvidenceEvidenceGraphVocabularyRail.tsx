"use client";

import type { JSX } from "react";

import {
  buildPackageEvidenceEvidenceGraphVocabulary,
  resolvePackageEvidenceEvidenceGraphPeerLink,
  type PackageEvidenceEvidenceGraphSurfaceId,
  type PackageEvidenceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/package-evidence-evidence-graph-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model =
    props.model ??
    buildPackageEvidenceEvidenceGraphVocabulary(props.runId);
  const peer = resolvePackageEvidenceEvidenceGraphPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "package-evidence"
      ? model.packageEvidenceLink
      : model.evidenceGraphLink;

  return (
    <VocabularyRail
      testIdPrefix="package-evidence-evidence-graph-vocabulary"
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
