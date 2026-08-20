import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { BaselineSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  BASELINE_SETTINGS_CANONICAL_PATH,
  BASELINE_SETTINGS_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_SOURCES,
  BASELINE_SETTINGS_SOURCES_INTRO,
} from "@/lib/baseline-settings-evidence-copy";

describe("baseline-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(BASELINE_SETTINGS_CANONICAL_PATH).toBe("/administration/baseline");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<BaselineSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("baseline-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(BASELINE_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("baseline-settings-sources");

    for (const link of BASELINE_SETTINGS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${BASELINE_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<BaselineSettingsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: BASELINE_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
