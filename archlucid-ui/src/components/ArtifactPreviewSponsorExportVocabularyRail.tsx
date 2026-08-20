"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildArtifactPreviewSponsorExportPairwiseRail,
  type ArtifactPreviewSponsorExportSurfaceId,
  type ArtifactPreviewSponsorExportVocabularyModel,
} from "@/lib/vocabulary/artifact-preview-sponsor-export-vocabulary";

export type ArtifactPreviewSponsorExportVocabularyRailProps = {
  readonly currentSurfaceId: ArtifactPreviewSponsorExportSurfaceId;
  readonly artifactHref?: string | null;
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ArtifactPreviewSponsorExportVocabularyModel;
};

/** TB-2303 — In-shell artifact preview vs sponsor package handoff export. */
export function ArtifactPreviewSponsorExportVocabularyRail(
  props: ArtifactPreviewSponsorExportVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.artifactPreviewLink,
          externalPeerLink: props.model.sponsorExportLink,
        }
      : buildArtifactPreviewSponsorExportPairwiseRail({
          artifactHref: props.artifactHref,
          runId: props.runId,
        });

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="artifact-preview-sponsor-export-vocabulary"
      reviewSurfaceId="artifact-preview"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
