import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsHubEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-settings-strips";
import {
  SETTINGS_HUB_CANONICAL_PATH,
  SETTINGS_HUB_FOLLOW_UPS_TITLE,
  SETTINGS_HUB_SOURCES,
  SETTINGS_HUB_SOURCES_INTRO,
} from "@/lib/settings-hub-evidence-copy";
import { HUB_SECONDARY_FOLLOW_UPS_TITLES } from "@/lib/evidence-orientation/hub-secondary-follow-ups";

describe("settings-hub-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(SETTINGS_HUB_CANONICAL_PATH).toBe("/administration");
  });

  it("renders operator Sources follow-ups without a self-href", () => {
    render(<SettingsHubEvidenceOrientationStrip />);

    expect(screen.queryByTestId("settings-hub-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(SETTINGS_HUB_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("settings-hub-sources");

    for (const link of SETTINGS_HUB_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${SETTINGS_HUB_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<SettingsHubEvidenceOrientationStrip />);

    expect(screen.getByRole("heading", { name: SETTINGS_HUB_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(SETTINGS_HUB_FOLLOW_UPS_TITLE).toBe(HUB_SECONDARY_FOLLOW_UPS_TITLES.settingsHub);
    expect(SETTINGS_HUB_SOURCES_INTRO.toLowerCase()).toContain("catalog above");
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
