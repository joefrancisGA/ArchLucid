import { describe, expect, it } from "vitest";

import { resolveFirstUnmatchedStandardsRule } from "@/lib/resolve-first-unmatched-standards-rule";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";

function row(overrides: Partial<StandardsRuleRow> = {}): StandardsRuleRow {
  return {
    ruleKey: "rule-1",
    ruleName: "Encrypt data at rest",
    standardFramework: "SOC 2",
    category: "Security",
    severity: "High",
    enforcementMode: "Enforce",
    sourcePolicyPack: "Pack A",
    sourcePolicyPackHref: null,
    sourcePolicyPackProvenanceLabel: null,
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
    ...overrides,
  };
}

describe("resolveFirstUnmatchedStandardsRule", () => {
  it("returns the first rule without linked findings", () => {
    const match = resolveFirstUnmatchedStandardsRule([
      row({ ruleKey: "matched", linkedFindingsHref: "/findings/1" }),
      row({ ruleKey: "unmatched", ruleName: "Require MFA" }),
    ]);

    expect(match?.ruleKey).toBe("unmatched");
  });
});
