"use client";

import type { JSX } from "react";

import {
  buildExtractUploadCloudConnectionsVocabulary,
  resolveExtractUploadCloudConnectionsPeerLink,
  type ExtractUploadCloudConnectionsSurfaceId,
  type ExtractUploadCloudConnectionsVocabularyModel,
} from "@/lib/vocabulary/extract-upload-cloud-connections-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ExtractUploadCloudConnectionsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current evidence-intake job and links to the peer. */
  readonly currentSurfaceId: ExtractUploadCloudConnectionsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildExtractUploadCloudConnectionsVocabulary}. */
  readonly model?: ExtractUploadCloudConnectionsVocabularyModel;
};

/**
 * TB-2281 — Compact vocabulary rail between Extract & Upload and Cloud connections.
 * Mount on extract-upload settings and Cloud connections (optionally evidence-intake help).
 * Distinct from Connection status ≠ Cloud connections (TB-2245).
 */
export function ExtractUploadCloudConnectionsVocabularyRail(
  props: ExtractUploadCloudConnectionsVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildExtractUploadCloudConnectionsVocabulary();
  const peer = resolveExtractUploadCloudConnectionsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "extract-upload"
      ? model.extractUploadLink
      : model.cloudConnectionsLink;

  return (
    <VocabularyRail
      testIdPrefix="extract-upload-cloud-connections-vocabulary"
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
