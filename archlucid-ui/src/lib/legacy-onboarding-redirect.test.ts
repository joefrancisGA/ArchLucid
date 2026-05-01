import { describe, expect, it } from "vitest";

import { buildOnboardingRedirectPath } from "./legacy-onboarding-redirect";

describe("buildOnboardingRedirectPath", () => {
  it("returns bare /onboarding when search is empty", () => {
    expect(buildOnboardingRedirectPath({})).toBe("/onboarding");
  });

  it("copies scalar query params", () => {
    expect(buildOnboardingRedirectPath({ source: "registration" })).toBe("/onboarding?source=registration");
  });

  it("appends repeated keys from array values", () => {
    const path = buildOnboardingRedirectPath({ tag: ["a", "b"] });
    expect(path).toContain("/onboarding?");
    expect(path).toContain("tag=a");
    expect(path).toContain("tag=b");
  });
});
