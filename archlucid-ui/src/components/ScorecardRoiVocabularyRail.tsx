"use client";

import type { JSX } from "react";

import {
  buildScorecardRoiVocabulary,
  resolveScorecardRoiPeerLink,
  type ScorecardRoiSurfaceId,
  type ScorecardRoiVocabularyModel,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ScorecardRoiVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ScorecardRoiSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScorecardRoiVocabulary}. */
  readonly model?: ScorecardRoiVocabularyModel;
};

/**
 * TB-2265 — Compact vocabulary rail between architecture scorecard and ROI summary.
 * Distinct from TB-2258 (ROI summary ≠ sponsor export). Mount on both Insights surfaces.
 */
export function ScorecardRoiVocabularyRail(
  props: ScorecardRoiVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildScorecardRoiVocabulary();
  const peer = resolveScorecardRoiPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "scorecard" ? model.scorecardLink : model.roiSummaryLink;

  return (
    <VocabularyRail
      testIdPrefix="scorecard-roi-vocabulary"
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
