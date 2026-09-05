import { describe, expect, it } from "vitest";

import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";

import {
  GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE,
  GET_STARTED_VERTICAL_PRESENTATIONS,
  buildGuidedTrialHref,
  buildSignInTrialHref,
} from "./get-started-content";
import {
  PRIMARY_SHOWCASE_PROOF_HREF,
  SECONDARY_CLAIMS_PROOF_HREF,
} from "@/lib/samples/sample-scenario-surface-alignment";

describe("get-started-content", () => {
  it("maps healthcare to Claims and other verticals to customer intake (TB-981)", () => {
    for (const entry of GET_STARTED_VERTICAL_PRESENTATIONS) {
      if (entry.slug === "healthcare") {
        expect(entry.publicSampleHref).toBe(SECONDARY_CLAIMS_PROOF_HREF);
      } else {
        expect(entry.publicSampleHref).toBe(PRIMARY_SHOWCASE_PROOF_HREF);
      }
    }
  });

  it("builds guided trial links that hand off to onboarding", () => {
    expect(buildGuidedTrialHref()).toBe("/architecture/first-review-guide?source=get-started");
    expect(buildGuidedTrialHref("retail")).toBe(
      "/architecture/first-review-guide?source=get-started&vertical=retail",
    );
    expect(buildGuidedTrialHref("retail")).not.toContain("templates");
  });

  it("buildSignInTrialHref matches buildAuthSignInHref onboarding return path", () => {
    expect(buildSignInTrialHref()).toBe(buildAuthSignInHref({ returnPath: buildGuidedTrialHref() }));
    expect(buildSignInTrialHref("retail")).toBe(
      buildAuthSignInHref({ returnPath: buildGuidedTrialHref("retail") }),
    );
  });

  it("describes guided workspace sign-in without work-identity-only framing", () => {
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/one-time code/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).toMatch(/supported identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/work identity/i);
    expect(GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE).not.toMatch(/Entra/i);
  });
});
