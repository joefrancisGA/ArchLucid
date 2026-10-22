import { describe, expect, it } from "vitest";

import {
  operatorWelcomeOnboardingHrefFromSearch,
  operatorWelcomeOnboardingUrlAlreadyMatches,
  parseOperatorWelcomeOpenFromSearch,
} from "@/lib/operator/operator-welcome-onboarding-url";

describe("operator welcome onboarding URL", () => {
  it("parses 1 and true as open", () => {
    expect(parseOperatorWelcomeOpenFromSearch("1")).toBe(true);
    expect(parseOperatorWelcomeOpenFromSearch("true")).toBe(true);
    expect(parseOperatorWelcomeOpenFromSearch(null)).toBe(false);
  });

  it("treats a missing welcomeOpen param as already matching closed", () => {
    expect(operatorWelcomeOnboardingUrlAlreadyMatches("", false)).toBe(true);
    expect(operatorWelcomeOnboardingUrlAlreadyMatches("tab=all", false)).toBe(true);
    expect(operatorWelcomeOnboardingUrlAlreadyMatches("", true)).toBe(false);
  });

  it("treats welcomeOpen=1 as already matching open", () => {
    expect(operatorWelcomeOnboardingUrlAlreadyMatches("welcomeOpen=1", true)).toBe(true);
    expect(operatorWelcomeOnboardingUrlAlreadyMatches("welcomeOpen=1", false)).toBe(false);
  });

  it("builds a root href without a dangling question mark when closing", () => {
    expect(operatorWelcomeOnboardingHrefFromSearch("welcomeOpen=1", false, "/")).toBe("/");
  });
});
