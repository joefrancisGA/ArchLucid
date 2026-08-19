"use client";

import type { JSX } from "react";

import {
  buildPreferencesNotificationsVocabulary,
  resolvePreferencesNotificationsPeerLink,
  type PreferencesNotificationsSurfaceId,
  type PreferencesNotificationsVocabularyModel,
} from "@/lib/vocabulary/preferences-notifications-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildPreferencesNotificationsVocabulary();
  const peer = resolvePreferencesNotificationsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "preferences"
      ? model.preferencesLink
      : model.notificationsLink;

  return (
    <VocabularyRail
      testIdPrefix="preferences-notifications-vocabulary"
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
