import { describe, expect, it } from "vitest";

import {
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import {
  PRIMARY_SHOWCASE_PROOF_HREF,
  SAMPLE_SCENARIO_SURFACE_ALIGNMENT,
  SECONDARY_CLAIMS_PROOF_HREF,
  publicSampleHrefForGetStartedVertical,
} from "@/lib/samples/sample-scenario-surface-alignment";
import { TRIAL_ONBOARDING_SAMPLE_RUN_ID } from "@/lib/trial-sample-run";

describe("sample-scenario-surface-alignment (TB-981)", () => {
  it("pins primary marketing proof on customer intake and healthcare on claims", () => {
    expect(PRIMARY_SHOWCASE_PROOF_HREF).toBe(`/showcase/${CUSTOMER_INTAKE_SAMPLE_RUN_ID}`);
    expect(SECONDARY_CLAIMS_PROOF_HREF).toBe(`/showcase/${CLAIMS_INTAKE_SAMPLE_RUN_ID}`);
    expect(publicSampleHrefForGetStartedVertical("healthcare")).toBe(SECONDARY_CLAIMS_PROOF_HREF);
    expect(publicSampleHrefForGetStartedVertical("retail")).toBe(PRIMARY_SHOWCASE_PROOF_HREF);
  });

  it("documents trial SQL co-primary separately from static showcase slugs", () => {
    const trialRow = SAMPLE_SCENARIO_SURFACE_ALIGNMENT.find((row) =>
      row.surface.includes("Trial onboarding"),
    );

    expect(trialRow?.showcaseRunId).toBe(TRIAL_ONBOARDING_SAMPLE_RUN_ID);
    expect(trialRow?.showcaseRunId).not.toBe(CUSTOMER_INTAKE_SAMPLE_RUN_ID);
    expect(trialRow?.notes).toMatch(/co-primary/i);
  });
});
