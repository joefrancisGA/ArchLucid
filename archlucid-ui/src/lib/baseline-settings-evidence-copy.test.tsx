import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaselineSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  BASELINE_SETTINGS_CANONICAL_PATH,
  BASELINE_SETTINGS_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  BASELINE_SETTINGS_CLAIM_HEADING_ID,
  BASELINE_SETTINGS_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_SOURCES,
  BASELINE_SETTINGS_SOURCES_INTRO,
} from "@/lib/baseline-settings-evidence-copy";

describe("baseline-settings-evidence-copy", () => {
  it("wires exports into the Baseline settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("baseline-settings-evidence-copy");
    expect(registrySource).toContain("BaselineSettingsEvidenceOrientationStrip");
    expect(BASELINE_SETTINGS_CANONICAL_PATH).toBe("/administration/baseline");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<BaselineSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("baseline-settings-claim-discipline")).toHaveTextContent(
      BASELINE_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(BASELINE_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("baseline-settings-sources");

    for (const link of BASELINE_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${BASELINE_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<BaselineSettingsEvidenceOrientationStrip />);

    const claim = screen.getByTestId("baseline-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", BASELINE_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: BASELINE_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: BASELINE_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
