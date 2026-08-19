import { describe, expect, it } from "vitest";

import { expectsVisibleClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_OPERATOR_CLAIM_NEGATION,
  SYSTEM_HEALTH_HELP_SOURCES,
  SYSTEM_HEALTH_HELP_SOURCES_INTRO,
} from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS,
  SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS,
  SYSTEM_HEALTH_HELP_OVERVIEW,
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE,
  SYSTEM_HEALTH_HELP_PRIMARY_ACTION,
  SYSTEM_HEALTH_HELP_READINESS_HELPER,
  SYSTEM_HEALTH_HELP_TILE_ITEMS,
} from "@/lib/system-health-help-guide-content";
import { SYSTEM_HEALTH_CLAIM_DISCIPLINE, SYSTEM_HEALTH_SOURCES_INTRO } from "@/lib/system-health-evidence-copy";

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

describe("system health help negation drift guard", () => {
  const claimBandVisible = expectsVisibleClaimDisciplineBand("help-system-health");

  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(SYSTEM_HEALTH_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    if (claimBandVisible) {
      expect(SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE).toContain(
        SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
      );
      expect(SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE).toContain(SYSTEM_HEALTH_HELP_OPERATOR_CLAIM_NEGATION);
      expect(SYSTEM_HEALTH_CLAIM_DISCIPLINE).toContain(SYSTEM_HEALTH_HELP_OPERATOR_CLAIM_NEGATION);

      const diligenceNegationCount =
        (SYSTEM_HEALTH_HELP_OVERVIEW.match(/sources trail/gi) ?? []).length +
        (SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE.match(/sources trail/gi) ?? []).length;

      expect(diligenceNegationCount).toBe(1);
    }
  });

  it("keeps overview and claim strip without long shared sentences", () => {
    if (!claimBandVisible) {
      return;
    }

    expect(
      maxSharedConsecutiveWords(SYSTEM_HEALTH_HELP_OVERVIEW, SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE),
    ).toBeLessThanOrEqual(8);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(SYSTEM_HEALTH_HELP_OVERVIEW).not.toBe(SYSTEM_HEALTH_HELP_PAGE_SUBTITLE);
  });

  it("links only tile rows with real destinations", () => {
    const linkedTiles = SYSTEM_HEALTH_HELP_TILE_ITEMS.filter((item) => item.href !== undefined);
    const plainTiles = SYSTEM_HEALTH_HELP_TILE_ITEMS.filter((item) => item.href === undefined);

    expect(linkedTiles).toHaveLength(2);
    expect(plainTiles.map((item) => item.label)).toEqual(["Deployment identity", "Manual refresh"]);
  });

  it("links the primary action to the live system health surface", () => {
    expect(SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href).toBe("/administration/system-health");
  });

  it("lists stacked help sources with when captions and no self-href", () => {
    const sourceHrefs = SYSTEM_HEALTH_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(SYSTEM_HEALTH_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(SYSTEM_HEALTH_HELP_SOURCES.every((source) => source.when !== undefined && source.when.length > 0)).toBe(
      true,
    );
    expect(sourceHrefs).not.toContain("/help/system-health");
    expect(SYSTEM_HEALTH_HELP_SOURCES_INTRO).toBe(SYSTEM_HEALTH_SOURCES_INTRO);
    expect(SYSTEM_HEALTH_HELP_SOURCES_INTRO.toLowerCase()).not.toContain("jobs");
  });

  it("avoids banned operator-job vocabulary in guide copy", () => {
    const guideCopy = [
      SYSTEM_HEALTH_HELP_OVERVIEW,
      SYSTEM_HEALTH_HELP_READINESS_HELPER,
      SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS.join(" "),
      SYSTEM_HEALTH_HELP_SOURCES_INTRO,
    ].join(" ");

    expect(guideCopy.toLowerCase()).not.toContain("operator jobs");
    expect(guideCopy.toLowerCase()).not.toContain("sources package");
  });
});
