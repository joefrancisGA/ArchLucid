import { describe, expect, it } from "vitest";

import {
  ADVISORY_SCANS_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_SOURCES,
} from "@/lib/advisory-scans-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE } from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_OVERVIEW,
  ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
} from "@/lib/advisory-scans-help-guide-content";

describe("advisory-scans help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(ADVISORY_SCANS_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE).toContain(
      ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const diligenceNegationCount =
      (ADVISORY_SCANS_HELP_OVERVIEW.match(/Sources package/gi) ?? []).length +
      (ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE.match(/Sources package/gi) ?? []).length;

    expect(diligenceNegationCount).toBe(1);
  });

  it("names explainability trace fields aligned with EXPLAINABILITY_TRACE_COVERAGE", () => {
    const explainabilityTile = ADVISORY_SCANS_HELP_TILE_ITEMS.find((item) => item.label === "Explainability trail");

    expect(explainabilityTile).toBeDefined();
    expect(explainabilityTile?.detail.toLowerCase()).toContain("graph nodes examined");
    expect(explainabilityTile?.detail.toLowerCase()).toContain("rules applied");
    expect(explainabilityTile?.detail.toLowerCase()).toContain("alternative paths");
  });

  it("lists stacked advisory-scans sources with when captions including AI usage", () => {
    const sourceHrefs = ADVISORY_SCANS_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ADVISORY_SCANS_SOURCES.every((source) => source.when !== undefined)).toBe(true);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "AI usage help")).toBe(true);
  });
});
