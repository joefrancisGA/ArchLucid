import { describe, expect, it } from "vitest";

import {
  buildTeamExpansionNudgeCopy,
  isTeamExpansionApproachingCap,
  isTeamExpansionUsageAtCap,
  resolveTeamExpansionNudgeTrigger,
} from "@/lib/team-expansion-nudge-trigger";

describe("team-expansion-nudge-trigger", () => {
  it("does not nudge at workspace cap (1 of 1) on Team", () => {
    expect(
      resolveTeamExpansionNudgeTrigger({
        isTrial: false,
        commercialTier: "Team",
        workspacesUsed: 1,
        workspacesLimit: 1,
        seatsUsed: 2,
        seatsLimit: 5,
      }),
    ).toBeNull();
  });

  it("nudges when Team seats are high but below the cap", () => {
    expect(
      resolveTeamExpansionNudgeTrigger({
        isTrial: false,
        commercialTier: "Team",
        seatsUsed: 4,
        seatsLimit: 5,
      }),
    ).toBe("seats");
  });

  it("does not nudge when Team seats are at the cap", () => {
    expect(
      resolveTeamExpansionNudgeTrigger({
        isTrial: false,
        commercialTier: "Team",
        seatsUsed: 5,
        seatsLimit: 5,
      }),
    ).toBeNull();
  });

  it("classifies approaching vs at cap", () => {
    expect(isTeamExpansionApproachingCap(4, 5)).toBe(true);
    expect(isTeamExpansionApproachingCap(5, 5)).toBe(false);
    expect(isTeamExpansionUsageAtCap(1, 1)).toBe(true);
    expect(isTeamExpansionUsageAtCap(4, 5)).toBe(false);
  });

  it("builds seat nudge copy", () => {
    expect(buildTeamExpansionNudgeCopy("seats", { seatsUsed: 4, seatsLimit: 5 }).title).toContain("seat");
  });
});