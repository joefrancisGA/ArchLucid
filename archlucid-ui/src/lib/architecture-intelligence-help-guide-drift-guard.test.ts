import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_SOURCES } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS,
  ARCHITECTURE_INTELLIGENCE_HELP_NEGATION_DRIFT_MARKERS,
  ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
} from "@/lib/architecture-intelligence-help-guide-content";

describe("architecture-intelligence help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of ARCHITECTURE_INTELLIGENCE_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE).toContain(
      ARCHITECTURE_INTELLIGENCE_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const auditExportNegationCount =
      (ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW.match(/full audit export/gi) ?? []).length +
      (ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE.match(/full audit export/gi) ?? []).length;

    expect(auditExportNegationCount).toBe(1);
  });

  it("states tenant retention exactly once across help copy constants", () => {
    const retentionMarker = ARCHITECTURE_INTELLIGENCE_HELP_NEGATION_DRIFT_MARKERS.retentionMustAppearOnce;
    const retentionCount =
      (ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE.match(new RegExp(retentionMarker, "gi")) ?? []).length +
      (ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE.match(new RegExp(retentionMarker, "gi")) ?? []).length +
      (ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW.match(new RegExp(retentionMarker, "gi")) ?? []).length;

    expect(retentionCount).toBe(1);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE).toContain(retentionMarker);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE).not.toContain(retentionMarker);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW).not.toBe(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW.toLowerCase()).not.toContain("repeatable baseline evaluation");
  });

  it("uses unique hrefs across feature tiles and the primary action", () => {
    const hrefs = [
      ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href,
      ...ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS.map((item) => item.href),
    ];

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("lists stacked architecture-intelligence sources with when captions", () => {
    const sourceHrefs = ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.every((source) => source.when !== undefined)).toBe(true);
    expect(ARCHITECTURE_INTELLIGENCE_SOURCES.every((source) => source.when !== undefined)).toBe(true);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.some((source) => source.label === "AI usage help")).toBe(true);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.some((source) => source.label === "Model governance help")).toBe(true);
  });
});
