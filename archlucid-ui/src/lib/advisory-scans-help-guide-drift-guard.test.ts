import { describe, expect, it } from "vitest";

import {
  ADVISORY_SCANS_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_SOURCES,
} from "@/lib/advisory-scans-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE } from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_OVERVIEW,
  ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS,
  ADVISORY_SCANS_HELP_PAGE_SUBTITLE,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
} from "@/lib/advisory-scans-help-guide-content";

describe("advisory-scans help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the capability boundary", () => {
    for (const phrase of ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(ADVISORY_SCANS_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE).toBe(
      ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );
    expect(ADVISORY_SCANS_CLAIM_DISCIPLINE).toBe(ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.claimMustContain);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(ADVISORY_SCANS_HELP_OVERVIEW).not.toBe(ADVISORY_SCANS_HELP_PAGE_SUBTITLE);
    expect(ADVISORY_SCANS_HELP_OVERVIEW.toLowerCase()).not.toContain("prioritized follow-up");
  });

  it("names audit trail tile with formal assurance destination", () => {
    const auditTile = ADVISORY_SCANS_HELP_TILE_ITEMS.find((item) => item.label === "Audit trail");

    expect(auditTile).toBeDefined();
    expect(auditTile?.detail.toLowerCase()).toContain("governed");
    expect(auditTile?.href).toContain("/governance/audit");
  });

  it("uses unique hrefs across tile labels", () => {
    const hrefs = ADVISORY_SCANS_HELP_TILE_ITEMS.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps tile hrefs disjoint from sources band hrefs", () => {
    const tileHrefs = ADVISORY_SCANS_HELP_TILE_ITEMS.map((item) => item.href);
    const sourceHrefs = ADVISORY_SCANS_SOURCES.map((source) => source.href);
    const overlap = tileHrefs.filter((href) => sourceHrefs.includes(href));

    expect(overlap).toHaveLength(0);
  });

  it("lists stacked advisory-scans sources with when captions including AI usage", () => {
    const sourceHrefs = ADVISORY_SCANS_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ADVISORY_SCANS_SOURCES).toHaveLength(4);
    expect(ADVISORY_SCANS_SOURCES.every((source) => source.when !== undefined)).toBe(true);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "AI usage help")).toBe(true);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "Architecture review guide")).toBe(true);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "Audit trail help")).toBe(true);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "Architecture reviews")).toBe(false);
    expect(ADVISORY_SCANS_SOURCES.some((source) => source.label === "Audit")).toBe(false);
  });
});
