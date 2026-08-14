import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_GUIDE_PATH } from "./first-review-guide-route";
import { buildOnboardingRedirectPath } from "./legacy-onboarding-redirect";

describe("buildOnboardingRedirectPath (TB-1796)", () => {
  it("returns bare first-review-guide when search is empty", () => {
    expect(buildOnboardingRedirectPath({})).toBe(FIRST_REVIEW_GUIDE_PATH);
  });

  it("copies scalar query params", () => {
    expect(buildOnboardingRedirectPath({ source: "registration" })).toBe(
      `${FIRST_REVIEW_GUIDE_PATH}?source=registration`,
    );
  });

  it("appends repeated keys from array values", () => {
    const path = buildOnboardingRedirectPath({ tag: ["a", "b"] });

    expect(path).toContain(`${FIRST_REVIEW_GUIDE_PATH}?`);
    expect(path).toContain("tag=a");
    expect(path).toContain("tag=b");
  });
});
