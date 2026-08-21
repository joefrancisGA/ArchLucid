import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_SOURCES } from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-graph-help-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_NEGATION_DRIFT_MARKERS,
  EVIDENCE_GRAPH_HELP_OVERVIEW,
  EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_HELP_PRIMARY_ACTION,
  EVIDENCE_GRAPH_HELP_TILE_ITEMS,
} from "@/lib/evidence-graph-help-guide-content";

describe("evidence-graph help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of EVIDENCE_GRAPH_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(EVIDENCE_GRAPH_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE).toContain(
      EVIDENCE_GRAPH_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const auditExportNegationCount =
      (EVIDENCE_GRAPH_HELP_OVERVIEW.match(/full audit export/gi) ?? []).length +
      (EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE.match(/full audit export/gi) ?? []).length;

    expect(auditExportNegationCount).toBe(1);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(EVIDENCE_GRAPH_HELP_OVERVIEW).not.toBe(EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE);
    expect(EVIDENCE_GRAPH_HELP_OVERVIEW.toLowerCase()).not.toContain("explore how evidence connects");
  });

  it("uses unique hrefs across feature tiles and the primary action", () => {
    const hrefs = [
      EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href,
      ...EVIDENCE_GRAPH_HELP_TILE_ITEMS.map((item) => item.href),
    ];

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("lists stacked evidence-graph sources with when captions and no self-href", () => {
    const sourceHrefs = EVIDENCE_GRAPH_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(EVIDENCE_GRAPH_SOURCES.every((source) => source.when !== undefined)).toBe(true);
    expect(EVIDENCE_GRAPH_SOURCES.some((source) => source.href === "/insights/evidence-graph")).toBe(false);
    expect(EVIDENCE_GRAPH_SOURCES.some((source) => source.label === "Evidence trail help")).toBe(true);
  });
});
