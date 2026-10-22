import { describe, expect, it } from "vitest";

import {
  diffRemediationPatternContent,
  formatRemediationPatternVersionContent,
  remediationPatternRegistryNeedsAttention,
  validateRemediationPatternYamlDraft,
} from "@/lib/remediation-pattern-content";

describe("remediation-pattern-content", () => {
  it("pretty-prints JSON content", () => {
    expect(formatRemediationPatternVersionContent('{"controlObjective":"Encrypt"}')).toBe(
      '{\n  "controlObjective": "Encrypt"\n}',
    );
  });

  it("validates YAML drafts", () => {
    expect(validateRemediationPatternYamlDraft("patternKey: test\nversion: 1.0.0").ok).toBe(true);
    expect(validateRemediationPatternYamlDraft(":\n  bad").ok).toBe(false);
  });

  it("flags patterns without an approved version as needing attention", () => {
    expect(
      remediationPatternRegistryNeedsAttention({
        patternId: "p1",
        patternKey: "k",
        displayName: "d",
        createdByActorKey: "a",
        createdUtc: "",
        updatedUtc: "",
        currentApprovedVersion: null,
      }),
    ).toBe(true);
  });

  it("diffs content lines", () => {
    const diff = diffRemediationPatternContent("a\nb", "a\nc");

    expect(diff).toEqual([
      { kind: "same", text: "a" },
      { kind: "removed", text: "b" },
      { kind: "added", text: "c" },
    ]);
  });
});
