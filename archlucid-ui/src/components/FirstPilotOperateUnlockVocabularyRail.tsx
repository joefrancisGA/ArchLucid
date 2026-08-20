"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildFirstPilotOperateUnlockPairwiseRail,
  type FirstPilotOperateUnlockSurfaceId,
  type FirstPilotOperateUnlockVocabularyModel,
} from "@/lib/vocabulary/first-pilot-operate-unlock-vocabulary";

export type FirstPilotOperateUnlockVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: FirstPilotOperateUnlockSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildFirstPilotOperateUnlockVocabulary}. */
  readonly model?: FirstPilotOperateUnlockVocabularyModel;
};

/**
 * TB-2311 — Compact vocabulary rail between first-pilot command center and Operate unlock
 * (retired panel; peer link remains for in-page scroll targets).
 */
export function FirstPilotOperateUnlockVocabularyRail(
  props: FirstPilotOperateUnlockVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.firstPilotLink,
          peerLink: props.model.operateUnlockLink,
        }
      : buildFirstPilotOperateUnlockPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="first-pilot-operate-unlock-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
