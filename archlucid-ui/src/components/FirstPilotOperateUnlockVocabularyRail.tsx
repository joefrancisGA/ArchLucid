"use client";

import type { JSX } from "react";

import {
  buildFirstPilotOperateUnlockVocabulary,
  resolveFirstPilotOperateUnlockPeerLink,
  type FirstPilotOperateUnlockSurfaceId,
  type FirstPilotOperateUnlockVocabularyModel,
} from "@/lib/vocabulary/first-pilot-operate-unlock-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildFirstPilotOperateUnlockVocabulary();
  const peer = resolveFirstPilotOperateUnlockPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "first-pilot"
      ? model.firstPilotLink
      : model.operateUnlockLink;

  return (
    <VocabularyRail
      testIdPrefix="first-pilot-operate-unlock-vocabulary"
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
