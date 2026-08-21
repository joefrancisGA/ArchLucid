"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildExtractUploadCloudConnectionsPairwiseRail,
  type ExtractUploadCloudConnectionsSurfaceId,
  type ExtractUploadCloudConnectionsVocabularyModel,
} from "@/lib/vocabulary/extract-upload-cloud-connections-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.extractUploadLink,
          peerLink: props.model.cloudConnectionsLink,
        }
      : buildExtractUploadCloudConnectionsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="extract-upload-cloud-connections-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
