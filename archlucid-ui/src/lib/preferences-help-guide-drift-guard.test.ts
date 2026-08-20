import { describe, expect, it } from "vitest";

import { expectsVisibleClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_SOURCES,
} from "@/lib/preferences-help-evidence-copy";
import {
  PREFERENCES_HELP_CHANGES_ITEMS,
  PREFERENCES_HELP_HOW_TO_READ_STEPS,
  PREFERENCES_HELP_NEGATION_DRIFT_MARKERS,
  PREFERENCES_HELP_OVERVIEW,
  PREFERENCES_HELP_PAGE_SUBTITLE,
  PREFERENCES_HELP_PRIMARY_ACTION,
  PREFERENCES_HELP_START_HERE_HELPER,
  PREFERENCES_HELP_TILE_ITEMS,
} from "@/lib/preferences-help-guide-content";

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

describe("preferences help negation drift guard", () => {
  const claimBandVisible = expectsVisibleClaimDisciplineBand("help-preferences");

  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of PREFERENCES_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(PREFERENCES_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    if (claimBandVisible) {
      expect(PREFERENCES_HELP_CLAIM_DISCIPLINE).toContain(
        PREFERENCES_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
      );

      const auditExportNegationCount =
        (PREFERENCES_HELP_OVERVIEW.match(/full audit export/gi) ?? []).length +
        (PREFERENCES_HELP_CLAIM_DISCIPLINE.match(/full audit export/gi) ?? []).length;

      expect(auditExportNegationCount).toBe(1);
    }
  });

  it("keeps overview and claim strip without long shared sentences", () => {
    if (!claimBandVisible) {
      return;
    }

    expect(
      maxSharedConsecutiveWords(PREFERENCES_HELP_OVERVIEW, PREFERENCES_HELP_CLAIM_DISCIPLINE),
    ).toBeLessThanOrEqual(8);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(PREFERENCES_HELP_OVERVIEW).not.toBe(PREFERENCES_HELP_PAGE_SUBTITLE);
  });

  it("scopes tile items to preference settings without cross-page destinations", () => {
    const tileLabels = PREFERENCES_HELP_TILE_ITEMS.map((item) => item.label);

    expect(tileLabels).not.toContain("Sign-in methods");
    expect(tileLabels).not.toContain("Onboarding");
    expect(tileLabels).not.toContain("Appearance card");
    expect(tileLabels).not.toContain("Personal scope");
    expect(new Set(tileLabels).size).toBe(tileLabels.length);
    expect(tileLabels).toHaveLength(2);
  });

  it("links the primary action to preferences settings", () => {
    expect(PREFERENCES_HELP_PRIMARY_ACTION.href).toBe("/account/preferences");
  });

  it("lists stacked preference sources with real routes and no self-href", () => {
    const sourceHrefs = PREFERENCES_HELP_SOURCES.map((source) => source.href);
    const sourceLabels = PREFERENCES_HELP_SOURCES.map((source) => source.label);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(PREFERENCES_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(PREFERENCES_HELP_SOURCES.every((source) => source.when !== undefined && source.when.length > 0)).toBe(
      true,
    );
    expect(sourceHrefs).not.toContain("/account/preferences");
    expect(sourceHrefs).not.toContain("/help/preferences");
    expect(sourceHrefs).not.toContain("/administration/users");
    expect(sourceLabels).not.toContain("Users and roles");
  });

  it("avoids API vocabulary in how-to steps and keeps role precondition in Start here copy", () => {
    const guideCopy = [
      PREFERENCES_HELP_OVERVIEW,
      PREFERENCES_HELP_START_HERE_HELPER,
      PREFERENCES_HELP_HOW_TO_READ_STEPS.join(" "),
      PREFERENCES_HELP_CHANGES_ITEMS.map((item) => `${item.label} ${item.detail}`).join(" "),
    ].join(" ");

    expect(guideCopy.toLowerCase()).not.toContain("api responds");
    expect(guideCopy.toLowerCase()).not.toContain("preferences api");
    expect(guideCopy.toLowerCase()).not.toContain("supported devices");
    expect(guideCopy.toLowerCase()).not.toContain("stacked");
  });
});
