"use client";

import type { JSX } from "react";

import {
  buildArtifactPreviewSponsorExportVocabulary,
  resolveArtifactPreviewSponsorExportPeerLink,
  type ArtifactPreviewSponsorExportSurfaceId,
  type ArtifactPreviewSponsorExportVocabularyModel,
} from "@/lib/vocabulary/artifact-preview-sponsor-export-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ArtifactPreviewSponsorExportVocabularyRailProps = {
  readonly currentSurfaceId: ArtifactPreviewSponsorExportSurfaceId;
  /** When mounting on a specific artifact preview page. */
  readonly artifactHref?: string | null;
  /** Optional run scope for sponsor handoff peer. */
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ArtifactPreviewSponsorExportVocabularyModel;
};

/** TB-2303 — In-shell artifact preview vs sponsor package handoff export. */
export function ArtifactPreviewSponsorExportVocabularyRail(
  props: ArtifactPreviewSponsorExportVocabularyRailProps,
): JSX.Element {
  const model =
    props.model ??
    buildArtifactPreviewSponsorExportVocabulary({
      artifactHref: props.artifactHref,
      runId: props.runId,
    });
  const peer = resolveArtifactPreviewSponsorExportPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "artifact-preview"
      ? model.artifactPreviewLink
      : model.sponsorExportLink;

  return (
    <VocabularyRail
      testIdPrefix="artifact-preview-sponsor-export-vocabulary"
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
