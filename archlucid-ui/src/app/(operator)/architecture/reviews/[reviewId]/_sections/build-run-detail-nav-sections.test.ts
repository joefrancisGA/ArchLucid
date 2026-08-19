import { describe, expect, it } from "vitest";

import {
  REVIEW_DETAIL_TAB_IDS,
  REVIEW_DETAIL_TAB_LABELS,
} from "@/lib/review-detail-workspace-tabs";
import type { ManifestSummary } from "@/types/authority";

import { buildRunDetailNavSections } from "./build-run-detail-nav-sections";

describe("buildRunDetailNavSections", () => {
  it("maps buyer-polished destinations to the eight-tab workspace contract", () => {
    const sections = buildRunDetailNavSections({
      buyerPolishedSections: true,
      manifestSummary: null,
      trustEvidenceCard: null,
      manifestId: "m-1",
      graphSnapshotId: null,
    });

    expect(sections.map((section) => section.id)).toEqual([...REVIEW_DETAIL_TAB_IDS]);
    expect(sections.find((section) => section.id === "policies")?.available).toBe(true);
    expect(sections.find((section) => section.id === "review-package")?.label).toBe(
      REVIEW_DETAIL_TAB_LABELS["review-package"],
    );
    expect(sections.find((section) => section.id === "architecture")?.label).toBe(
      REVIEW_DETAIL_TAB_LABELS.architecture,
    );
  });

  it("gates evidence tab when no manifest and no trust card", () => {
    const sections = buildRunDetailNavSections({
      buyerPolishedSections: false,
      manifestSummary: null,
      trustEvidenceCard: null,
      manifestId: null,
      graphSnapshotId: null,
    });

    expect(sections.find((section) => section.id === "evidence")?.available).toBe(true);
    expect(sections.find((section) => section.id === "policies")?.available).toBe(false);
  });

  it("enables policies when manifest summary exists", () => {
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

    expect(sections.find((section) => section.id === "policies")?.available).toBe(true);
    expect(sections.find((section) => section.id === "activity")?.label).toBe(
      REVIEW_DETAIL_TAB_LABELS.activity,
    );
  });
});
