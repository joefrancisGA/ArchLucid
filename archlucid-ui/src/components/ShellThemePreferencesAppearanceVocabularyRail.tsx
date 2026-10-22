"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildShellThemePreferencesAppearancePairwiseRail,
  buildShellThemePreferencesAppearanceVocabulary,
  resolveShellThemePreferencesAppearancePeerLink,
  type ShellThemePreferencesAppearanceSurfaceId,
  type ShellThemePreferencesAppearanceVocabularyModel,
} from "@/lib/vocabulary/shell-theme-preferences-appearance-vocabulary";

export type ShellThemePreferencesAppearanceVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer when one exists. */
  readonly currentSurfaceId: ShellThemePreferencesAppearanceSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildShellThemePreferencesAppearanceVocabulary}. */
  readonly model?: ShellThemePreferencesAppearanceVocabularyModel;
};

/**
 * TB-2328 — Compact vocabulary rail between shell ColorModeToggle and Preferences Appearance.
 * Mount on PreferencesSettingsPageView and near ColorModeToggle in AppShellClient minimal chrome.
 */
export function ShellThemePreferencesAppearanceVocabularyRail(
  props: ShellThemePreferencesAppearanceVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.shellThemeToggleLink,
          peerLink: props.model.preferencesAppearanceLink,
        }
      : buildShellThemePreferencesAppearancePairwiseRail();
  const peerLinkOverride = resolveShellThemePreferencesAppearancePeerLink(props.currentSurfaceId);

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="shell-theme-preferences-appearance-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      model={pairwiseModel}
      peerLinkOverride={peerLinkOverride}
    />
  );
}
