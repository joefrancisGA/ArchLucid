import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferencesSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/preferences/_sections/PreferencesSettingsEvidenceOrientationStrip";
import {
  PREFERENCES_SETTINGS_CANONICAL_PATH,
  PREFERENCES_SETTINGS_SOURCES,
} from "@/lib/preferences-settings-evidence-copy";

describe("PreferencesSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Preferences", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("preferences-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("preferences-settings-claim-discipline")).toBeInTheDocument();

    for (const link of PREFERENCES_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PREFERENCES_SETTINGS_SOURCES.some((link) => link.href === PREFERENCES_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
