import { describe, expect, it } from "vitest";

import {
  buildPolicyPackChangeImpactPreview,
  POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY,
  POLICY_PACK_CHANGE_IMPACT_TITLE,
} from "@/lib/policy/policy-pack-change-impact";

describe("buildPolicyPackChangeImpactPreview", () => {
  it("uses honest no-estimate copy without inventing a severity count", () => {
    const preview = buildPolicyPackChangeImpactPreview({ findingCount: 12 });

    expect(preview.title).toBe(POLICY_PACK_CHANGE_IMPACT_TITLE);
    expect(preview.body).toBe(POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY);
    expect(preview.hasSeverityEstimate).toBe(false);
    expect(preview.body).not.toMatch(/\d+\s+finding/);
    expect(preview.findingContext).toContain("12 findings");
  });

  it("omits finding context when count is zero", () => {
    const preview = buildPolicyPackChangeImpactPreview({ findingCount: 0 });

    expect(preview.findingContext).toBeNull();
    expect(preview.body).toBe(POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY);
  });

  it("includes severity estimate only when provided", () => {
    const preview = buildPolicyPackChangeImpactPreview({
      findingCount: 3,
      severityChangeEstimate: 2,
    });

    expect(preview.hasSeverityEstimate).toBe(true);
    expect(preview.body).toContain("about 2 findings");
    expect(preview.findingContext).toContain("3 findings");
  });

  it("treats null severity estimate as absent", () => {
    const preview = buildPolicyPackChangeImpactPreview({
      findingCount: 1,
      severityChangeEstimate: null,
    });

    expect(preview.body).toBe(POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY);
    expect(preview.hasSeverityEstimate).toBe(false);
  });
});