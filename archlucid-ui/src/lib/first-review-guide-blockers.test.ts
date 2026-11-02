import { describe, expect, it } from "vitest";

import {
  resolveFirstReviewGuideOnePrerequisite,
  resolveFirstReviewGuidePolicyPackAssigned,
} from "./first-review-guide-blockers";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA } from "@/lib/buyer-copy/operator-home-sample";

describe("first-review-guide-blockers", () => {
  it("returns null while prerequisite inputs are still loading", () => {
    expect(
      resolveFirstReviewGuideOnePrerequisite({
        samplePackageSelected: null,
        policyPackAssigned: true,
      }),
    ).toBeNull();
  });

  it("prefers the sample package before the policy pack", () => {
    const blocker = resolveFirstReviewGuideOnePrerequisite({
      samplePackageSelected: false,
      policyPackAssigned: false,
    });

    expect(blocker?.id).toBe("sample-package");
    expect(blocker?.href).toBe("/");
    expect(blocker?.actionLabel).toBe(OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA);
  });

  it("surfaces the policy pack when the sample is selected", () => {
    const blocker = resolveFirstReviewGuideOnePrerequisite({
      samplePackageSelected: true,
      policyPackAssigned: false,
    });

    expect(blocker?.id).toBe("policy-pack");
    expect(blocker?.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
  });

  it("returns null when both prerequisites are ready", () => {
    expect(
      resolveFirstReviewGuideOnePrerequisite({
        samplePackageSelected: true,
        policyPackAssigned: true,
      }),
    ).toBeNull();
  });

  it("treats an enabled workspace assignment as assigned", () => {
    expect(resolveFirstReviewGuidePolicyPackAssigned([{ isEnabled: false }, { isEnabled: true }])).toBe(true);
    expect(resolveFirstReviewGuidePolicyPackAssigned([{ isEnabled: false }])).toBe(false);
  });
});
