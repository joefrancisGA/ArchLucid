import { describe, expect, it } from "vitest";

import type { ManifestSummary } from "@/types/authority";

import { buildRunDetailNavSections } from "./build-run-detail-nav-sections";

describe("buildRunDetailNavSections", () => {
  it("buyer-polished uses outcome/deliverables labels and gates graph on graphSnapshotId", () => {
    const sections = buildRunDetailNavSections({
      buyerPolishedSections: true,
      manifestSummary: null,
      trustEvidenceCard: null,
      manifestId: "m-1",
      graphSnapshotId: null,
    });

    expect(sections.find((s) => s.id === "architecture-graph")?.available).toBe(false);
    expect(sections.find((s) => s.id === "artifacts-exports")?.label).toBe("Deliverables");
  });

  it("full operator includes review trail and diagnostics sections", () => {
    const manifestSummary: ManifestSummary = {
      manifestId: "man-1",
      runId: "run-1",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "h",
      ruleSetId: "r",
      ruleSetVersion: "1",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
      status: "Committed",
    };

    const sections = buildRunDetailNavSections({
      buyerPolishedSections: false,
      manifestSummary,
      trustEvidenceCard: null,
      manifestId: "m-1",
      graphSnapshotId: "g-1",
    });

    expect(sections.some((s) => s.id === "authority-chain")).toBe(true);
    expect(sections.some((s) => s.id === "agent-forensics")).toBe(true);
    expect(sections.find((s) => s.id === "architecture-graph")?.label).toBe("Architecture graph");
  });
});
