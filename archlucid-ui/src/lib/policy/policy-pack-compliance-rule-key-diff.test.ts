import { describe, expect, it } from "vitest";

import {
  diffComplianceRuleKeys,
  mergeComplianceRuleKeySets,
} from "@/lib/policy/policy-pack-compliance-rule-key-diff";

describe("diffComplianceRuleKeys", () => {
  it("marks added, removed, and unchanged keys", () => {
    const items = diffComplianceRuleKeys(["alpha", "beta"], ["beta", "gamma"]);

    expect(items).toEqual([
      { key: "alpha", changeType: "removed" },
      { key: "beta", changeType: "unchanged" },
      { key: "gamma", changeType: "added" },
    ]);
  });

  it("deduplicates and trims keys before diffing", () => {
    const items = diffComplianceRuleKeys([" alpha ", "alpha"], ["alpha"]);

    expect(items).toEqual([{ key: "alpha", changeType: "unchanged" }]);
  });
});

describe("mergeComplianceRuleKeySets", () => {
  it("returns sorted unique union", () => {
    expect(mergeComplianceRuleKeySets(["b", "a"], ["c", "a"])).toEqual(["a", "b", "c"]);
  });
});
