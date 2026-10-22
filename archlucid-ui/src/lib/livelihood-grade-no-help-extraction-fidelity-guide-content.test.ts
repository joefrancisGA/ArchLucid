import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_FORBIDDEN_LINK_MARKERS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-guide-content";

describe("livelihood-grade-no-help-extraction-fidelity-guide-content (EEX Phase 2)", () => {
  it("dedupes subtitle from overview lead", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE).not.toBe(
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD,
    );
    expect(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD).not.toContain(
      "Evidence-backed findings must point at stored sources.",
    );
  });

  it("preserves engineering identifiers in rules and enforcement copy", () => {
    const rulesJoined = LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES.join(" ");
    expect(rulesJoined).toMatch(/NotVerifiable/);
    expect(
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES.some((s) =>
        s.description.includes("getDecisionGradeFindingProvenanceViolations"),
      ),
    ).toBe(true);
    expect(
      LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES.some((s) =>
        s.description.includes("NotVerifiable"),
      ),
    ).toBe(true);
  });

  it("uses in-app help links only", () => {
    for (const surface of LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES) {
      expect(surface.href.startsWith("/help/")).toBe(true);
      for (const marker of LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_FORBIDDEN_LINK_MARKERS) {
        expect(surface.href).not.toContain(marker);
      }
    }
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS.length);
    expect(ids.has("help-extraction-fidelity-provenance-gaps")).toBe(true);
    expect(ids.has("help-extraction-fidelity-enforcement-surfaces")).toBe(true);
  });
});
