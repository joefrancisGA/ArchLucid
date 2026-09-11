import { describe, expect, it } from "vitest";

import { shouldShowSecurityWorkingCareerHonestyStrip } from "@/lib/governance/security-working-career-honesty-strip";

describe("shouldShowSecurityWorkingCareerHonestyStrip (CG-017)", () => {
  it("shows on Working Security when eval chrome is off", () => {
    expect(
      shouldShowSecurityWorkingCareerHonestyStrip({
        productLine: "security",
        workspaceMode: "working",
        workspaceMounted: true,
        buyerPolishedEvalChrome: false,
      }),
    ).toBe(true);
  });

  it("hides on Architecture Working so the chooser stays the labeled door", () => {
    expect(
      shouldShowSecurityWorkingCareerHonestyStrip({
        productLine: "architecture",
        workspaceMode: "working",
        workspaceMounted: true,
        buyerPolishedEvalChrome: false,
      }),
    ).toBe(false);
  });

  it("hides on Guided Security so Guided stays teaching chrome", () => {
    expect(
      shouldShowSecurityWorkingCareerHonestyStrip({
        productLine: "security",
        workspaceMode: "guided",
        workspaceMounted: true,
        buyerPolishedEvalChrome: false,
      }),
    ).toBe(false);
  });

  it("hides on demo trial and static eval chrome", () => {
    expect(
      shouldShowSecurityWorkingCareerHonestyStrip({
        productLine: "security",
        workspaceMode: "working",
        workspaceMounted: true,
        buyerPolishedEvalChrome: true,
      }),
    ).toBe(false);
  });

  it("hides until workspace mode is mounted", () => {
    expect(
      shouldShowSecurityWorkingCareerHonestyStrip({
        productLine: "security",
        workspaceMode: "working",
        workspaceMounted: false,
        buyerPolishedEvalChrome: false,
      }),
    ).toBe(false);
  });
});
