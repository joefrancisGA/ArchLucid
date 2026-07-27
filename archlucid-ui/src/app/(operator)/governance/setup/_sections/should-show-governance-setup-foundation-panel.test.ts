import { describe, expect, it } from "vitest";

import { GOVERNANCE_SETUP_FOUNDATION_INDICATORS } from "./governance-setup-guide-steps";
import { shouldShowGovernanceSetupFoundationPanel } from "./should-show-governance-setup-foundation-panel";

describe("shouldShowGovernanceSetupFoundationPanel (TB-1138)", () => {
  it("hides the panel when every foundation indicator is still pending", () => {
    expect(
      shouldShowGovernanceSetupFoundationPanel(GOVERNANCE_SETUP_FOUNDATION_INDICATORS, [
        "not-started",
        "not-started",
        "not-started",
        "not-started",
        "not-started",
      ]),
    ).toBe(false);

    expect(
      shouldShowGovernanceSetupFoundationPanel(GOVERNANCE_SETUP_FOUNDATION_INDICATORS, [
        "in-progress",
        "not-started",
        "not-started",
        "not-started",
        "not-started",
      ]),
    ).toBe(false);
  });

  it("shows the panel once any foundation indicator is complete", () => {
    expect(
      shouldShowGovernanceSetupFoundationPanel(GOVERNANCE_SETUP_FOUNDATION_INDICATORS, [
        "complete",
        "in-progress",
        "not-started",
        "not-started",
        "not-started",
      ]),
    ).toBe(true);
  });
});
