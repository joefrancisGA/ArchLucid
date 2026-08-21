import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";
import {
  PREFERENCES_SETTINGS_CANONICAL_PATH,
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  PREFERENCES_SETTINGS_SOURCES,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
} from "@/lib/preferences-settings-evidence-copy";

describe("preferences-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(PREFERENCES_SETTINGS_CANONICAL_PATH).toBe("/account/preferences");
  });

  it("renders operator Sources follow-ups without a claim-discipline band", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("preferences-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PREFERENCES_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("preferences-settings-sources");

    for (const link of PREFERENCES_SETTINGS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${PREFERENCES_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    expect(screen.getByRole("heading", { name: PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
