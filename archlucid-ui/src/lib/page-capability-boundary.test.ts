import { describe, expect, it } from "vitest";

import {
  PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS,
  PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE,
  PAGE_CAPABILITY_BOUNDARY_ASK,
  PAGE_CAPABILITY_BOUNDARY_COMPARE,
  PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
  PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW,
  PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE,
  getPageCapabilityBoundary,
} from "@/lib/page-capability-boundary";

const ALL_SURFACE_IDS = [
  "ask",
  "compare",
  "governanceFindings",
  "architectureIntelligence",
  "impactPreview",
  "advisoryScans",
  "searchReviewEvidence",
] as const;

describe("page-capability-boundary (TB-2197 / TB-2274)", () => {
  it("uses a shared disclosure heading for all presets", () => {
    expect(PAGE_CAPABILITY_BOUNDARY_ASK.heading).toBe(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY);
    expect(PAGE_CAPABILITY_BOUNDARY_COMPARE.heading).toBe(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY);
    expect(PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY).toBe("What this page does not do");
  });

  it("getPageCapabilityBoundary resolves ask, compare, governanceFindings, and TB-2274 surfaces", () => {
    expect(getPageCapabilityBoundary("ask")).toEqual(PAGE_CAPABILITY_BOUNDARY_ASK);
    expect(getPageCapabilityBoundary("compare")).toEqual(PAGE_CAPABILITY_BOUNDARY_COMPARE);
    expect(getPageCapabilityBoundary("governanceFindings")).toEqual(
      PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
    );
    expect(getPageCapabilityBoundary("architectureIntelligence")).toEqual(
      PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE,
    );
    expect(getPageCapabilityBoundary("impactPreview")).toEqual(PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW);
    expect(getPageCapabilityBoundary("advisoryScans")).toEqual(PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS);
    expect(getPageCapabilityBoundary("searchReviewEvidence")).toEqual(
      PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE,
    );
  });

  it("keeps non-empty, concrete cannot-do items per surface", () => {
    for (const surfaceId of ALL_SURFACE_IDS) {
      const boundary = getPageCapabilityBoundary(surfaceId);
      expect(boundary.items.length).toBeGreaterThanOrEqual(3);

      for (const item of boundary.items) {
        expect(item.trim().length).toBeGreaterThan(12);
      }
    }
  });

  it("uses product vocabulary (not run or job) in cannot-do copy", () => {
    const corpus = ALL_SURFACE_IDS.flatMap((surfaceId) => getPageCapabilityBoundary(surfaceId).items)
      .join("\n")
      .toLowerCase();

    expect(corpus).toContain("decision register");
    expect(corpus).toContain("finalized review record");
    expect(corpus).not.toMatch(/\bjob\b/);
    expect(corpus).not.toMatch(/\brun\b/);
  });

  it("keeps ask boundary distinct from inventing false cloud write claims", () => {
    const askCorpus = PAGE_CAPABILITY_BOUNDARY_ASK.items.join("\n").toLowerCase();
    expect(askCorpus).toContain("finalize");
    expect(askCorpus).toContain("evidence");
    expect(askCorpus).not.toContain("key vault");
  });

  it("keeps TB-2274 surfaces distinct in buyer nouns", () => {
    expect(PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE.items.join(" ").toLowerCase()).toContain(
      "architecture package",
    );
    expect(PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW.items.join(" ").toLowerCase()).toContain("compare");
    expect(PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS.items.join(" ").toLowerCase()).toContain("finding");
    expect(PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE.items.join(" ").toLowerCase()).toContain(
      "evidence",
    );
  });
});
