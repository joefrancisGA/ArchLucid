import { describe, expect, it } from "vitest";

import { IMPROVEMENT_PLANNING_HELP_SOURCES } from "@/lib/improvement-planning-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE } from "@/lib/improvement-planning-help-evidence-copy";
import {
  IMPROVEMENT_PLANNING_HELP_NEGATION_DRIFT_MARKERS,
  IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS,
  IMPROVEMENT_PLANNING_HELP_OVERVIEW,
  IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE,
  IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION,
  IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS,
} from "@/lib/improvement-planning-help-guide-content";

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

describe("improvement-planning help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of IMPROVEMENT_PLANNING_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(IMPROVEMENT_PLANNING_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE).toContain(
      IMPROVEMENT_PLANNING_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const diligenceNegationCount =
      (IMPROVEMENT_PLANNING_HELP_OVERVIEW.match(/sources package/gi) ?? []).length +
      (IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE.match(/sources package/gi) ?? []).length;

    expect(diligenceNegationCount).toBe(1);
  });

  it("keeps overview and claim strip without long shared sentences", () => {
    expect(
      maxSharedConsecutiveWords(IMPROVEMENT_PLANNING_HELP_OVERVIEW, IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE),
    ).toBeLessThanOrEqual(8);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(IMPROVEMENT_PLANNING_HELP_OVERVIEW).not.toBe(IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE);
  });

  it("uses unique hrefs across show and output tile groups", () => {
    const showHrefs = IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS.map((item) => item.href);
    const outputHrefs = IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS.map((item) => item.href);

    expect(new Set(showHrefs).size).toBe(showHrefs.length);
    expect(new Set(outputHrefs).size).toBe(outputHrefs.length);
  });

  it("links the primary action to improvement planning", () => {
    expect(IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.href).toBe("/insights/improvement-planning");
  });

  it("lists stacked planning sources with real routes and admin-only product learning", () => {
    const sourceHrefs = IMPROVEMENT_PLANNING_HELP_SOURCES.map((source) => source.href);
    const productLearningSource = IMPROVEMENT_PLANNING_HELP_SOURCES.find((source) => source.label === "Product learning");

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(IMPROVEMENT_PLANNING_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(IMPROVEMENT_PLANNING_HELP_SOURCES.every((source) => source.when !== undefined && source.when.length > 0)).toBe(
      true,
    );
    expect(productLearningSource?.adminOnly).toBe(true);
  });
});
