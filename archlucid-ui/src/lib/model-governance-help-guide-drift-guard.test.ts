import { describe, expect, it } from "vitest";

import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_SOURCES,
} from "@/lib/model-governance-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS,
  MODEL_GOVERNANCE_HELP_NEGATION_DRIFT_MARKERS,
  MODEL_GOVERNANCE_HELP_OVERVIEW,
  MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE,
  MODEL_GOVERNANCE_HELP_PRIMARY_ACTION,
  MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE,
} from "@/lib/model-governance-help-guide-content";

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

function labelsDifferOnlyByHelpOrAmpersand(left: string, right: string): boolean {
  const normalize = (label: string): string =>
    label
      .toLowerCase()
      .replace(/\bhelp\b/g, "")
      .replace(/&/g, "and")
      .replace(/\s+/g, " ")
      .trim();

  return normalize(left) === normalize(right);
}

describe("model-governance help negation drift guard", () => {
  it("keeps overview positive-only and claim band as the single diligence negation", () => {
    for (const phrase of MODEL_GOVERNANCE_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(MODEL_GOVERNANCE_HELP_OVERVIEW, `overview must not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE).toContain(
      MODEL_GOVERNANCE_HELP_NEGATION_DRIFT_MARKERS.claimMustContain,
    );

    const auditExportNegationCount =
      (MODEL_GOVERNANCE_HELP_OVERVIEW.match(/full audit export/gi) ?? []).length +
      (MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE.match(/full audit export/gi) ?? []).length;

    expect(auditExportNegationCount).toBe(1);
  });

  it("keeps overview and claim strip without long shared sentences", () => {
    expect(
      maxSharedConsecutiveWords(MODEL_GOVERNANCE_HELP_OVERVIEW, MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE),
    ).toBeLessThanOrEqual(8);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(MODEL_GOVERNANCE_HELP_OVERVIEW).not.toBe(MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE);
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE).not.toBe(MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.label);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS[0]?.id).toBe("data-boundary");
    expect(MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-model-governance-claim-discipline-heading")).toBe(
      true,
    );
  });

  it("lists model-governance help sources with unique hrefs and distinct labels", () => {
    const sourceHrefs = MODEL_GOVERNANCE_HELP_SOURCES.map((source) => source.href);
    const sourceLabels = MODEL_GOVERNANCE_HELP_SOURCES.map((source) => source.label);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(MODEL_GOVERNANCE_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);

    for (let i = 0; i < sourceLabels.length; i++) {
      for (let j = i + 1; j < sourceLabels.length; j++) {
        expect(
          labelsDifferOnlyByHelpOrAmpersand(sourceLabels[i] ?? "", sourceLabels[j] ?? ""),
          `labels "${sourceLabels[i]}" and "${sourceLabels[j]}" differ only by help/&`,
        ).toBe(false);
      }
    }
  });

  it("links the primary action to administration model governance", () => {
    expect(MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href).toBe("/administration/model-governance");
  });
});
