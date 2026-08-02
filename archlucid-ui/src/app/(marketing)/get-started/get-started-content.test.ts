import { describe, expect, it } from "vitest";

import {
  GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE,
  GET_STARTED_VERTICAL_PRESENTATIONS,
  buildGuidedTrialHref,
} from "./get-started-content";

describe("get-started-content", () => {
  it("maps all vertical public samples to Claims showcase (M-107 Option A)", () => {
    for (const entry of GET_STARTED_VERTICAL_PRESENTATIONS) {
      expect(entry.publicSampleHref).toBe("/showcase/claims-intake-modernization");
    }
  });

  it("builds guided trial links that hand off to onboarding", () => {
    expect(buildGuidedTrialHref()).toBe("/architecture/first-review-guide?source=get-started");
    expect(buildGuidedTrialHref("retail")).toBe(
      "/architecture/first-review-guide?source=get-started&vertical=retail",
    );
    expect(buildGuidedTrialHref("retail")).not.toContain("templates");
  });

  it("describes guided workspace sign-in without work-identity-only framing", () => {
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/one-time code/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/supported identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/work identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/Entra/i);
  });
});
