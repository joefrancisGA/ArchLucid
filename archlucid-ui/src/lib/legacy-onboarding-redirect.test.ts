import { describe, expect, it } from "vitest";

import { buildGettingStartedRedirectPath } from "./legacy-onboarding-redirect";

describe("buildGettingStartedRedirectPath", () => {
  it("returns bare /getting-started when search is empty", () => {
    expect(buildGettingStartedRedirectPath({})).toBe("/getting-started");
  });

  it("copies scalar query params", () => {
    expect(buildGettingStartedRedirectPath({ source: "registration" })).toBe("/getting-started?source=registration");
  });

  it("appends repeated keys from array values", () => {
    const path = buildGettingStartedRedirectPath({ tag: ["a", "b"] });
    expect(path).toContain("/getting-started?");
    expect(path).toContain("tag=a");
    expect(path).toContain("tag=b");
  });
});
