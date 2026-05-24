import { describe, expect, it } from "vitest";

import {
  buildTrialUpgradeNudgePricingHref,
  resolveTrialUpgradeNudgeTrigger,
} from "@/lib/trial-upgrade-nudge-trigger";

describe("resolveTrialUpgradeNudgeTrigger", () => {
  it("returns null for non-active trials", () => {
    expect(resolveTrialUpgradeNudgeTrigger({ status: "Expired", daysRemaining: 1 })).toBeNull();
  });

  it("returns expiry when days remaining is within urgent window", () => {
    expect(
      resolveTrialUpgradeNudgeTrigger({
        status: "Active",
        daysRemaining: 6,
        trialRunsUsed: 1,
        trialRunsLimit: 10,
      }),
    ).toBe("expiry");
  });

  it("returns runs when usage crosses 70 percent", () => {
    expect(
      resolveTrialUpgradeNudgeTrigger({
        status: "Active",
        daysRemaining: 20,
        trialRunsUsed: 7,
        trialRunsLimit: 10,
      }),
    ).toBe("runs");
  });

  it("returns seats when usage crosses 80 percent", () => {
    expect(
      resolveTrialUpgradeNudgeTrigger({
        status: "Active",
        daysRemaining: 20,
        trialSeatsUsed: 4,
        trialSeatsLimit: 5,
      }),
    ).toBe("seats");
  });

  it("prioritizes expiry over run and seat thresholds", () => {
    expect(
      resolveTrialUpgradeNudgeTrigger({
        status: "Active",
        daysRemaining: 3,
        trialRunsUsed: 9,
        trialRunsLimit: 10,
        trialSeatsUsed: 4,
        trialSeatsLimit: 5,
      }),
    ).toBe("expiry");
  });
});

describe("buildTrialUpgradeNudgePricingHref", () => {
  it("includes source, trigger, and quote anchor", () => {
    expect(buildTrialUpgradeNudgePricingHref("runs")).toBe(
      "/pricing?source=trial-nudge&trigger=runs#pricing-quote-request",
    );
  });
});
