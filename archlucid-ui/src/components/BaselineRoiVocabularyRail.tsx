"use client";

import type { JSX } from "react";

import {
  buildBaselineRoiVocabulary,
  resolveBaselineRoiPeerLink,
  type BaselineRoiSurfaceId,
  type BaselineRoiVocabularyModel,
} from "@/lib/vocabulary/baseline-roi-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type BaselineRoiVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: BaselineRoiSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildBaselineRoiVocabulary}. */
  readonly model?: BaselineRoiVocabularyModel;
};

/**
 * TB-2275 — Compact vocabulary rail between baseline settings and ROI summary.
 * Distinct from TB-2265 (scorecard ≠ ROI) and TB-2258 (ROI ≠ sponsor export).
 */
export function BaselineRoiVocabularyRail(
  props: BaselineRoiVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildBaselineRoiVocabulary();
  const peer = resolveBaselineRoiPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "baseline" ? model.baselineLink : model.roiSummaryLink;

  return (
    <VocabularyRail
      testIdPrefix="baseline-roi-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
