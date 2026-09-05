import { describe, expect, it } from "vitest";

import {
  resolveFindingWorkItemCoverageHonesty,
  resolveFindingWorkItemCoverageHonestyFromInput,
} from "./copy-finding-as-work-item-coverage-honesty";
import type { FindingWorkItemBuildInput } from "./copy-finding-as-work-item-types";
import type { FindingInspectPayload } from "@/types/finding-inspect";

const baseInput: FindingWorkItemBuildInput = {
  runId: "run-1",
  findingId: "finding-1",
  siteOrigin: "https://demo.example.org",
  severityLabel: "High",
  categoryLabel: "Security",
  impactedAreaLabel: "Egress",
  title: "Open egress",
  description: "Outbound path is public.",
  recommendedAction: "Restrict egress.",
  decisionRuleId: "rule-1",
  decisionRuleName: "Egress audit",
  evidenceExcerpts: ["subnet-1"],
  trustLabel: "DeterministicRule",
  trustLabelReason: "Policy rule matched.",
};

function inspectPayload(typedPayload: Record<string, unknown>): FindingInspectPayload {
  return {
    findingId: "finding-1",
    runId: "run-1",
    decisionRuleId: "rule-1",
    decisionRuleName: "Egress audit",
    evidence: [],
    recommendedActions: ["Restrict egress."],
    auditRowId: "audit-1",
    manifestVersion: "1",
    typedPayload,
  };
}

describe("resolveFindingWorkItemCoverageHonesty (FD-07)", () => {
  it("includes typed-engine honesty for deterministic rule findings", () => {
    const honesty = resolveFindingWorkItemCoverageHonesty(baseInput, inspectPayload({}));

    expect(honesty).not.toBeNull();
    expect(honesty?.line).toContain("Checklist coverage stays on the package");
    expect(honesty?.typedEngineProtected).toBe(true);
  });

  it("adds asserted vs inferred when typed payload supplies the label", () => {
    const honesty = resolveFindingWorkItemCoverageHonesty(
      baseInput,
      inspectPayload({ assertedVsInferred: "Inferred" }),
    );

    expect(honesty?.line).toContain("Finding provenance: Inferred.");
    expect(honesty?.provenanceKind).toBe("inferred");
  });

  it("returns null when no honesty signals are present", () => {
    const honesty = resolveFindingWorkItemCoverageHonesty(
      {
        ...baseInput,
        trustLabel: "EvidenceBacked",
        decisionRuleId: null,
        decisionRuleName: null,
      },
      inspectPayload({}),
    );

    expect(honesty).toBeNull();
  });
});

describe("resolveFindingWorkItemCoverageHonestyFromInput", () => {
  it("returns pre-rendered honesty lines from build input", () => {
    const honesty = resolveFindingWorkItemCoverageHonestyFromInput({
      ...baseInput,
      coverageHonestyLine: "Checklist coverage stays on the package when the insight-density gate demotes a finding.",
    });

    expect(honesty?.line).toContain("Checklist coverage");
  });
});
