import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackComplianceRuleKeyDiffView } from "@/components/PolicyPackComplianceRuleKeyDiffView";
import {
  POLICY_AB_DEMO_ADDED_RULE_KEY,
  POLICY_AB_DEMO_ALLOW_RESULT,
  POLICY_AB_DEMO_BLOCK_RESULT,
  POLICY_AB_DEMO_DEFAULT_RULE_KEYS,
  POLICY_AB_DEMO_STRICT_RULE_KEYS,
} from "@/lib/policy/policy-ab-demo-fixture";
import { diffComplianceRuleKeys } from "@/lib/policy/policy-pack-compliance-rule-key-diff";
import { summarizePolicyImpactGateResult } from "@/lib/policy/policy-pack-impact-preview";

describe("policy A/B demo fixture", () => {
  it("stricter pack adds exactly one compliance rule key over the default pack", () => {
    const added = diffComplianceRuleKeys(
      POLICY_AB_DEMO_DEFAULT_RULE_KEYS,
      POLICY_AB_DEMO_STRICT_RULE_KEYS,
    ).filter((item) => item.changeType === "added");

    expect(added).toEqual([{ key: POLICY_AB_DEMO_ADDED_RULE_KEY, changeType: "added" }]);
  });

  it("renders the added rule key in the before/after delta view", () => {
    render(
      <PolicyPackComplianceRuleKeyDiffView
        beforeKeys={POLICY_AB_DEMO_DEFAULT_RULE_KEYS}
        afterKeys={POLICY_AB_DEMO_STRICT_RULE_KEYS}
      />,
    );

    expect(screen.getByTestId("policy-pack-rule-key-diff-added")).toHaveTextContent(
      POLICY_AB_DEMO_ADDED_RULE_KEY,
    );
    expect(screen.queryByTestId("policy-pack-rule-key-diff-removed")).toBeNull();
  });

  it("flips the pre-commit gate from allow to block across the two arms", () => {
    const allow = summarizePolicyImpactGateResult("allow", POLICY_AB_DEMO_ALLOW_RESULT);
    const block = summarizePolicyImpactGateResult("block-critical", POLICY_AB_DEMO_BLOCK_RESULT);

    expect(allow.blocked).toBe(false);
    expect(block.blocked).toBe(true);
    expect(block.blocked).not.toBe(allow.blocked);
  });
});
