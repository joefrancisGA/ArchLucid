import { describe, expect, it } from "vitest";

import { formatTrialLimitReasonLabel, parseTrialLimitProblemDetails } from "./trial-limit-problem";

describe("parseTrialLimitProblemDetails", () => {
  it("reads trialReason and daysRemaining from problem json", () => {
    const parsed = parseTrialLimitProblemDetails(
      JSON.stringify({
        title: "Trial limit reached",
        status: 402,
        trialReason: "RunsExceeded",
        daysRemaining: 3,
      }),
    );

    expect(parsed).toEqual({ trialReason: "RunsExceeded", daysRemaining: 3 });
  });

  it("returns null when trialReason is missing", () => {
    expect(parseTrialLimitProblemDetails(JSON.stringify({ status: 402 }))).toBeNull();
  });
});

describe("formatTrialLimitReasonLabel", () => {
  it("maps known reasons", () => {
    expect(formatTrialLimitReasonLabel("Expired")).toMatch(/expired/i);
    expect(formatTrialLimitReasonLabel("RunsExceeded")).toMatch(/review runs/i);
  });
});
