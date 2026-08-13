"use client";

import type { JSX } from "react";

import {
  buildImpactPreviewCompareVocabulary,
  resolveImpactPreviewComparePeerLink,
  type ImpactPreviewCompareSurfaceId,
  type ImpactPreviewCompareVocabularyModel,
} from "@/lib/vocabulary/impact-preview-compare-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ImpactPreviewCompareVocabularyRailProps = {
  /** Surface hosting the strip — marks the current insight job and links to the peer. */
  readonly currentSurfaceId: ImpactPreviewCompareSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildImpactPreviewCompareVocabulary}. */
  readonly model?: ImpactPreviewCompareVocabularyModel;
};

/**
 * TB-2250 — Compact vocabulary rail between Impact preview and Compare two reviews.
 * Mount on both hubs so operators do not conflate change simulation with pairwise diff.
 * Distinct from ValidateCompareVocabularyRail (TB-2240).
 */
export function ImpactPreviewCompareVocabularyRail(
  props: ImpactPreviewCompareVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildImpactPreviewCompareVocabulary();
  const peer = resolveImpactPreviewComparePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "impact-preview"
      ? model.impactPreviewLink
      : model.compareLink;

  return (
    <VocabularyRail
      testIdPrefix="impact-preview-compare-vocabulary"
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
