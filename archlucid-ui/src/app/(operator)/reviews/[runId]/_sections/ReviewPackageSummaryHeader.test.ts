import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageViewSource = readFileSync(join(sectionsDir, "RunDetailPageView.tsx"), "utf8");
const summaryHeaderSource = readFileSync(join(sectionsDir, "ReviewPackageSummaryHeader.tsx"), "utf8");

describe("ReviewPackageSummaryHeader integration", () => {
  it("is the single render site for the four former summary widgets on RunDetailPageView", () => {
    expect(pageViewSource).toContain("<ReviewPackageSummaryHeader");
    expect(pageViewSource).not.toContain("<RunDetailPageHeader");
    expect(pageViewSource).not.toContain("<ReviewPackagePlainSummary");
    expect(pageViewSource).not.toContain("<ReviewPackageEvidenceDensityStrip");
    expect(pageViewSource).toMatch(/outcomeCards=\{outcomeCardsEl\}/);
    expect(pageViewSource).not.toMatch(/>\s*\{outcomeCardsEl\}\s*</);
  });

  it("branches explicitly on draft vs finalized mode", () => {
    expect(summaryHeaderSource).toContain('data-review-package-summary-mode={props.mode}');
    expect(summaryHeaderSource).toContain('props.mode === "finalized"');
  });

  it("composes the retired widgets inside the summary header section", () => {
    expect(summaryHeaderSource).toContain("<RunDetailPageHeader");
    expect(summaryHeaderSource).toContain("<ReviewPackagePlainSummary");
    expect(summaryHeaderSource).toContain("<ReviewPackageEvidenceDensityStrip");
    expect(summaryHeaderSource).toContain("review-package-attention-line");
    expect(summaryHeaderSource).toContain("<ReviewPackagePrimaryAction");
    expect(summaryHeaderSource).toContain("demoteHeaderFinalizeButton");
  });
});
