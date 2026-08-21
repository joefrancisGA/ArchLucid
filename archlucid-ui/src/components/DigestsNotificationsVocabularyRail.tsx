"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildDigestsNotificationsPairwiseRail,
  type DigestsNotificationsSurfaceId,
  type DigestsNotificationsVocabularyModel,
} from "@/lib/vocabulary/digests-notifications-vocabulary";

export type DigestsNotificationsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: DigestsNotificationsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDigestsNotificationsVocabulary}. */
  readonly model?: DigestsNotificationsVocabularyModel;
};

/**
 * TB-2254 — Compact vocabulary rail between Digests content cadence and Notifications preference launcher.
 * Mount on Digests hub and the notifications preference center.
 */
export function DigestsNotificationsVocabularyRail(
  props: DigestsNotificationsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.digestsLink,
          peerLink: props.model.notificationsLink,
        }
      : buildDigestsNotificationsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="digests-notifications-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
