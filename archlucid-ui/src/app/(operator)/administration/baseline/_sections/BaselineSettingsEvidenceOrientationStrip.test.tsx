import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaselineSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/baseline/_sections/BaselineSettingsEvidenceOrientationStrip";
import {
  BASELINE_SETTINGS_CANONICAL_PATH,
  BASELINE_SETTINGS_SOURCES,
} from "@/lib/baseline-settings-evidence-copy";

describe("BaselineSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking baseline settings", () => {
    render(<BaselineSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("baseline-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-settings-claim-discipline")).toBeInTheDocument();

    for (const link of BASELINE_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      BASELINE_SETTINGS_SOURCES.some((link) => link.href === BASELINE_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
