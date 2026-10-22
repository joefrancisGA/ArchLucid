"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPreferencesNotificationsPairwiseRail,
  type PreferencesNotificationsSurfaceId,
  type PreferencesNotificationsVocabularyModel,
} from "@/lib/vocabulary/preferences-notifications-vocabulary";

export type PreferencesNotificationsVocabularyRailProps = {
  readonly currentSurfaceId: PreferencesNotificationsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PreferencesNotificationsVocabularyModel;
};

/** TB-2295 — Appearance Preferences vs Notifications channel launcher. */
export function PreferencesNotificationsVocabularyRail(
  props: PreferencesNotificationsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.preferencesLink,
          peerLink: props.model.notificationsLink,
        }
      : buildPreferencesNotificationsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="preferences-notifications-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
