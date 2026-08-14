import { describe, expect, it } from "vitest";

import {
  SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE,
  SHELL_THEME_PREFERENCES_APPEARANCE_HEADING,
  SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
  SHELL_THEME_PREFERENCES_APPEARANCE_SHELL_LINK,
  SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO,
  SHELL_THEME_TOGGLE_NO_ROUTE_HREF,
  buildShellThemePreferencesAppearanceVocabulary,
  resolveShellThemePreferencesAppearancePeerLink,
} from "@/lib/vocabulary/shell-theme-preferences-appearance-vocabulary";
import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";

describe("shell-theme-preferences-appearance-vocabulary (TB-2328)", () => {
  it("explains shell ColorModeToggle vs Preferences Appearance durable theme", () => {
    const model = buildShellThemePreferencesAppearanceVocabulary();

    expect(model.heading).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_HEADING);
    expect(model.whyTwo).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("chrome");
    expect(model.whyTwo.toLowerCase()).toContain("durable");
    expect(model.compactLine).toBe(SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE);

    expect(model.shellThemeToggleLink).toEqual(SHELL_THEME_PREFERENCES_APPEARANCE_SHELL_LINK);
    expect(model.shellThemeToggleLink.href).toBe(SHELL_THEME_TOGGLE_NO_ROUTE_HREF);

    expect(model.preferencesAppearanceLink).toEqual(
      SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
    );
    expect(model.preferencesAppearanceLink.href).toBe(ACCOUNT_PREFERENCES_PATH);
    expect(model.preferencesAppearanceLink.label).toBe("Preferences appearance");
  });

  it("resolves Preferences peer from shell and null peer from Preferences", () => {
    expect(resolveShellThemePreferencesAppearancePeerLink("shell-theme-toggle")).toEqual(
      SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
    );

    expect(resolveShellThemePreferencesAppearancePeerLink("preferences-appearance")).toBeNull();
  });
});
