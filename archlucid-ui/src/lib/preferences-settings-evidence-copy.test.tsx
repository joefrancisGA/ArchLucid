import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  PREFERENCES_SETTINGS_CANONICAL_PATH,
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE,
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_SETTINGS_CLAIM_HEADING_ID,
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  PREFERENCES_SETTINGS_SOURCES,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
} from "@/lib/preferences-settings-evidence-copy";

describe("preferences-settings-evidence-copy", () => {
  it("wires exports into the Preferences settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("preferences-settings-evidence-copy");
    expect(registrySource).toContain("PreferencesSettingsEvidenceOrientationStrip");
    expect(PREFERENCES_SETTINGS_CANONICAL_PATH).toBe("/account/preferences");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("preferences-settings-claim-discipline")).toHaveTextContent(
      PREFERENCES_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(PREFERENCES_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("preferences-settings-sources");

    for (const link of PREFERENCES_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${PREFERENCES_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    const claim = screen.getByTestId("preferences-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", PREFERENCES_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
