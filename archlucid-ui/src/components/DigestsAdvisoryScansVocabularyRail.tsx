"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildDigestsAdvisoryScansPairwiseRail,
  type DigestsAdvisoryScansSurfaceId,
  type DigestsAdvisoryScansVocabularyModel,
} from "@/lib/vocabulary/digests-advisory-scans-vocabulary";

export type DigestsAdvisoryScansVocabularyRailProps = {
  readonly currentSurfaceId: DigestsAdvisoryScansSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: DigestsAdvisoryScansVocabularyModel;
};

/** TB-2314 — Digests content cadence vs Advisory scans hub. */
export function DigestsAdvisoryScansVocabularyRail(
  props: DigestsAdvisoryScansVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.digestsLink,
          peerLink: props.model.advisoryScansLink,
        }
      : buildDigestsAdvisoryScansPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="digests-advisory-scans-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
