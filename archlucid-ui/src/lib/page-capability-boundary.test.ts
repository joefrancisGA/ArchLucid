import { describe, expect, it } from "vitest";

import {
  PAGE_CAPABILITY_BOUNDARY_ASK,
  PAGE_CAPABILITY_BOUNDARY_COMPARE,
  PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
  getPageCapabilityBoundary,
} from "@/lib/page-capability-boundary";

describe("page-capability-boundary (TB-2197)", () => {
  it("uses a shared disclosure heading for all presets", () => {
    expect(PAGE_CAPABILITY_BOUNDARY_ASK.heading).toBe(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY);
    expect(PAGE_CAPABILITY_BOUNDARY_COMPARE.heading).toBe(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY);
    expect(PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS.heading).toBe(
      PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
    );
    expect(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY).toBe("What this page does not do");
  });

  it("getPageCapabilityBoundary resolves ask, compare, and governanceFindings", () => {
    expect(getPageCapabilityBoundary("ask")).toEqual(PAGE_CAPABILITY_BOUNDARY_ASK);
    expect(getPageCapabilityBoundary("compare")).toEqual(PAGE_CAPABILITY_BOUNDARY_COMPARE);
    expect(getPageCapabilityBoundary("governanceFindings")).toEqual(
      PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
    );
  });

  it("keeps non-empty, concrete cannot-do items per surface", () => {
    for (const surfaceId of ["ask", "compare", "governanceFindings"] as const) {
      const boundary = getPageCapabilityBoundary(surfaceId);
      expect(boundary.items.length).toBeGreaterThanOrEqual(3);

      for (const item of boundary.items) {
        expect(item.trim().length).toBeGreaterThan(12);
      }
    }
  });

  it("uses product vocabulary (not run or job) in cannot-do copy", () => {
    const corpus = [
      ...PAGE_CAPABILITY_BOUNDARY_ASK.items,
      ...PAGE_CAPABILITY_BOUNDARY_COMPARE.items,
      ...PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS.items,
    ]
      .join("\n")
      .toLowerCase();

    expect(corpus).toContain("decision register");
    expect(corpus).toContain("signed review record");
    expect(corpus).not.toMatch(/\bjob\b/);
    expect(corpus).not.toMatch(/\brun\b/);
  });

  it("keeps ask boundary distinct from inventing false cloud write claims", () => {
    const askCorpus = PAGE_CAPABILITY_BOUNDARY_ASK.items.join("\n").toLowerCase();
    expect(askCorpus).toContain("finalize");
    expect(askCorpus).toContain("evidence");
    expect(askCorpus).not.toContain("key vault");
  });
});
