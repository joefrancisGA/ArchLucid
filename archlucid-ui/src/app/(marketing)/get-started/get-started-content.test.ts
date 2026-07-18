import { describe, expect, it } from "vitest";

import {
  GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE,
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

  it("builds guided trial links that hand off to onboarding", () => {
    expect(buildGuidedTrialHref()).toBe("/onboarding?source=get-started");
    expect(buildGuidedTrialHref("retail")).toBe("/onboarding?source=get-started&vertical=retail");
    expect(buildGuidedTrialHref("retail")).not.toContain("templates");
  });

  it("describes guided workspace sign-in without work-identity-only framing", () => {
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/one-time code/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/supported identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/work identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/Entra/i);
  });
});
