import { describe, expect, it } from "vitest";

import { IMPACT_PREVIEW_SOURCES } from "@/lib/impact-preview-evidence-copy";
import { IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE } from "@/lib/impact-preview-help-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_GUIDE_HEADINGS,
  IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_NEGATION_DRIFT_MARKERS,
  IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_OVERVIEW,
  IMPACT_PREVIEW_HELP_PAGE_SUBTITLE,
  IMPACT_PREVIEW_HELP_PRIMARY_ACTION,
} from "@/lib/impact-preview-help-guide-content";

function normalizeCopyWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function maxSharedConsecutiveWords(left: string, right: string): number {
  const leftWords = normalizeCopyWords(left);
  const rightWords = normalizeCopyWords(right);
  let max = 0;

  for (let i = 0; i < leftWords.length; i++) {
    for (let j = 0; j < rightWords.length; j++) {
      let k = 0;

      while (
        i + k < leftWords.length &&
        j + k < rightWords.length &&
        leftWords[i + k] === rightWords[j + k]
      ) {
        k += 1;
      }

      if (k > max) {
        max = k;
      }
    }
  }

  return max;
}

describe("impact-preview help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of IMPACT_PREVIEW_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(IMPACT_PREVIEW_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE).toContain(
      IMPACT_PREVIEW_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const auditExportNegationCount =
      (IMPACT_PREVIEW_HELP_OVERVIEW.match(/full audit export/gi) ?? []).length +
      (IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE.match(/full audit export/gi) ?? []).length;

    expect(auditExportNegationCount).toBe(1);
  });

  it("keeps overview and claim strip without long shared sentences", () => {
    expect(maxSharedConsecutiveWords(IMPACT_PREVIEW_HELP_OVERVIEW, IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE)).toBeLessThanOrEqual(
      8,
    );
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(IMPACT_PREVIEW_HELP_OVERVIEW).not.toBe(IMPACT_PREVIEW_HELP_PAGE_SUBTITLE);
    expect(IMPACT_PREVIEW_HELP_OVERVIEW.toLowerCase()).not.toContain("before-and-after effects");
  });

  it("uses unique hrefs across input and output tile groups", () => {
    const inputHrefs = IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS.map((item) => item.href);
    const outputHrefs = IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS.map((item) => item.href);

    expect(new Set(inputHrefs).size).toBe(inputHrefs.length);
    expect(new Set(outputHrefs).size).toBe(outputHrefs.length);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(IMPACT_PREVIEW_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(IMPACT_PREVIEW_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-impact-preview-claim-discipline-heading")).toBe(
      true,
    );
  });

  it("links the primary action and simulation results tile to impact preview", () => {
    expect(IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href).toBe("/insights/impact-preview");
    const simulationTile = IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS.find((item) => item.label === "Simulation results");

    expect(simulationTile?.href).toBe("/insights/impact-preview");
  });

  it("links proposed change to improvement planning, not the retired planning route", () => {
    const proposedChangeTile = IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS.find((item) => item.label === "Proposed change");

    expect(proposedChangeTile?.href).toBe("/insights/improvement-planning");
  });

  it("lists stacked impact-preview sources with real routes", () => {
    const sourceHrefs = IMPACT_PREVIEW_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(IMPACT_PREVIEW_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
  });
});
