import { describe, expect, it } from "vitest";

import {
  SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE,
  SHELL_THEME_PREFERENCES_APPEARANCE_HEADING,
  SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
  SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO,
  buildShellThemePreferencesAppearanceVocabulary,
  resolveShellThemePreferencesAppearancePeerLink,
} from "@/lib/vocabulary/shell-theme-preferences-appearance-vocabulary";
import { SETTINGS_PREFERENCES_PATH } from "@/lib/settings-admin-route-paths";

describe("shell-theme-preferences-appearance-vocabulary (TB-2328)", () => {
  it("explains shell chrome toggle vs durable Preferences appearance", () => {
    const model = buildShellThemePreferencesAppearanceVocabulary();

    expect(model.heading).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_HEADING);
    expect(model.whyTwo).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("shell");
    expect(model.whyTwo.toLowerCase()).toContain("preferences");
    expect(model.compactLine).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE);
    expect(model.preferencesAppearanceLink.href).toBe(SETTINGS_PREFERENCES_PATH);
  });

  it("peers shell toggle to Preferences and has no peer page from Preferences", () => {
    expect(resolveShellThemePreferencesAppearancePeerLink("shell-theme-toggle")).toEqual(
      SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
    );
    expect(resolveShellThemePreferencesAppearancePeerLink("preferences-appearance")).toBeNull();
  });
});
