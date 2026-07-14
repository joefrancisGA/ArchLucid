import { describe, expect, it } from "vitest";

import {
  GET_STARTED_VERTICAL_PRESENTATIONS,
  buildGuidedTrialHref,
} from "./get-started-content";

describe("get-started-content", () => {
  it("maps healthcare to the public showcase and keeps other verticals on demo preview", () => {
    const healthcare = GET_STARTED_VERTICAL_PRESENTATIONS.find((entry) => entry.slug === "healthcare");
    const financial = GET_STARTED_VERTICAL_PRESENTATIONS.find((entry) => entry.slug === "financial-services");

    expect(healthcare?.publicSampleHref).toBe("/showcase/claims-intake-modernization");
    expect(financial?.publicSampleHref).toBe("/demo/preview");
  });

  it("builds guided trial links without internal path leakage", () => {
    expect(buildGuidedTrialHref()).toBe("/signup");
    expect(buildGuidedTrialHref("retail")).toBe("/signup?vertical=retail");
    expect(buildGuidedTrialHref("retail")).not.toContain("templates");
  });
});
