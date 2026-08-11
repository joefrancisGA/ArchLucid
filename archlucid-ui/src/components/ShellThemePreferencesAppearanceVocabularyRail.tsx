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
  readonly currentSurfaceId: ShellThemePreferencesAppearanceSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ShellThemePreferencesAppearanceVocabularyModel;
};

/**
 * TB-2328 — Shell chrome theme toggle vs Preferences appearance durable setting.
 * Mount near ColorModeToggle (shell) and on Preferences appearance.
 */
export function ShellThemePreferencesAppearanceVocabularyRail(
  props: ShellThemePreferencesAppearanceVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildShellThemePreferencesAppearanceVocabulary();
  const peer = resolveShellThemePreferencesAppearancePeerLink(props.currentSurfaceId);
  const currentLabel =
    props.currentSurfaceId === "shell-theme-toggle"
      ? model.shellThemeToggleLink.label
      : model.preferencesAppearanceLink.label;

  return (
    <VocabularyRail
      testIdPrefix="shell-theme-preferences-appearance-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLabel}
      links={
        peer === null
          ? []
          : [{ href: peer.href, label: peer.label, testIdSuffix: "peer-link" }]
      }
    />
  );
}
