import { describe, expect, it } from "vitest";

import {
  GET_STARTED_VERTICAL_PRESENTATIONS,
  GET_STARTED_WORK_IDENTITY_SIGN_IN_NOTE,
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

  it("describes supported work identity without Entra-first framing (TB-774)", () => {
    expect(GET_STARTED_WORK_IDENTITY_SIGN_IN_NOTE).toMatch(/Microsoft, Google/i);
    expect(GET_STARTED_WORK_IDENTITY_SIGN_IN_NOTE).toMatch(/SSO provider/i);
    expect(GET_STARTED_WORK_IDENTITY_SIGN_IN_NOTE).not.toMatch(/Entra/i);
  });
});
