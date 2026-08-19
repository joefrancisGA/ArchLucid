"use client";

import type { JSX } from "react";

import {
  buildShellThemePreferencesAppearanceVocabulary,
  resolveShellThemePreferencesAppearancePeerLink,
  type ShellThemePreferencesAppearanceSurfaceId,
  type ShellThemePreferencesAppearanceVocabularyModel,
} from "@/lib/vocabulary/shell-theme-preferences-appearance-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildShellThemePreferencesAppearanceVocabulary();
  const peer = resolveShellThemePreferencesAppearancePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "shell-theme-toggle"
      ? model.shellThemeToggleLink
      : model.preferencesAppearanceLink;

  return (
    <VocabularyRail
      testIdPrefix="shell-theme-preferences-appearance-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={
        peer === null ? [] : [{ ...peer, testIdSuffix: "peer-link" }]
      }
    />
  );
}
