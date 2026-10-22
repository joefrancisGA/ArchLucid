import { describe, expect, it } from "vitest";

import {
  CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE,
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import { getShowcaseStaticDemoPayload } from "@/lib/showcase-static-demo";

const FORBIDDEN_PRIMARY_MARKETING_ORGS = ["contoso", "northwind"] as const;

describe("customer-intake-modernization sample package (TB-980)", () => {
  it("pins the canonical primary buyer sentence", () => {
    expect(CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryBuyerSentence).toBe(CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE);
    expect(CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE).toContain("Enterprise Customer Intake Modernization");
    expect(CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE).toContain("evidence-backed findings");
  });

  it("does not include Contoso or Northwind in primary marketing strings", () => {
    const haystack = [
      CUSTOMER_INTAKE_PRIMARY_BUYER_SENTENCE,
      CUSTOMER_INTAKE_SAMPLE_DEFINITION.buyerReviewPackageTitle,
      CUSTOMER_INTAKE_SAMPLE_DEFINITION.buyerReviewTitle,
      CUSTOMER_INTAKE_SAMPLE_DEFINITION.tenantName,
      CUSTOMER_INTAKE_SAMPLE_RUN_ID,
    ]
      .join("\n")
      .toLowerCase();

    for (const forbidden of FORBIDDEN_PRIMARY_MARKETING_ORGS) {
      expect(haystack).not.toContain(forbidden);
    }
  });

  it("serves a full static showcase payload at the generic slug", () => {
    const payload = getShowcaseStaticDemoPayload(CUSTOMER_INTAKE_SAMPLE_RUN_ID);

    expect(payload.run.runId).toBe(CUSTOMER_INTAKE_SAMPLE_RUN_ID);
    expect(payload.manifest.manifestId).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION.manifestId);
    expect(payload.runExplanation?.findingCount).toBe(CUSTOMER_INTAKE_SAMPLE_DEFINITION.spineCounts.findingCount);
    expect(payload.pipelineTimeline.length).toBeGreaterThanOrEqual(5);
    expect(payload.artifacts.length).toBeGreaterThanOrEqual(3);
  });
});
