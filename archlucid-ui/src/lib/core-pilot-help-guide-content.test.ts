import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
  CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/core-pilot-help-guide-content";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("core-pilot-help-guide-content sample CTA (TB-1332)", () => {
  it("names the Claims Intake showcase on the sample review CTA", () => {
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL.toLowerCase()).toContain("claims");
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL).toContain(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
    expect(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL).not.toBe("Open sample review");
    expect(CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href).toBe(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
    expect(CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label).toBe(CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL);
  });
});
