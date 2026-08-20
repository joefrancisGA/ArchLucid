"use client";

import type { JSX } from "react";

import {
  buildDigestsNotificationsVocabulary,
  resolveDigestsNotificationsPeerLink,
  type DigestsNotificationsSurfaceId,
  type DigestsNotificationsVocabularyModel,
} from "@/lib/vocabulary/digests-notifications-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildDigestsNotificationsVocabulary();
  const peer = resolveDigestsNotificationsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "digests" ? model.digestsLink : model.notificationsLink;

  return (
    <VocabularyRail
      testIdPrefix="digests-notifications-vocabulary"
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
