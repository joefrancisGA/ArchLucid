import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";
import {
  SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE,
  SHELL_THEME_PREFERENCES_APPEARANCE_HEADING,
  SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
  SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO,
} from "@/lib/vocabulary/shell-theme-preferences-appearance-vocabulary";

describe("ShellThemePreferencesAppearanceVocabularyRail (TB-2328)", () => {
  it("renders shell strip with peer link to Preferences appearance", () => {
    render(
      <ShellThemePreferencesAppearanceVocabularyRail currentSurfaceId="shell-theme-toggle" />,
    );

    const strip = screen.getByTestId("shell-theme-preferences-appearance-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "shell-theme-toggle");
    expect(strip.textContent ?? "").toContain(SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE);

    const peer = screen.getByTestId("shell-theme-preferences-appearance-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK.label);
    expect(peer).toHaveAttribute("href", SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK.href);
  });

  it("renders preferences strip with teaching copy and no peer link", () => {
    render(
      <ShellThemePreferencesAppearanceVocabularyRail currentSurfaceId="preferences-appearance" />,
    );

    const strip = screen.getByTestId("shell-theme-preferences-appearance-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "preferences-appearance");
    expect(strip.textContent ?? "").toContain(SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE);
    expect(
      screen.queryByTestId("shell-theme-preferences-appearance-vocabulary-peer-link"),
    ).not.toBeInTheDocument();
  });

  it("renders full variant with why-two explanation and current label", () => {
    render(
      <ShellThemePreferencesAppearanceVocabularyRail
        currentSurfaceId="preferences-appearance"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("shell-theme-preferences-appearance-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SHELL_THEME_PREFERENCES_APPEARANCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("shell-theme-preferences-appearance-vocabulary-current"),
    ).toHaveTextContent(SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK.label);
  });
});
