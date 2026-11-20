import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round93 mounted contract", () => {
  it("pickers same review, search blocked, pair blocked aggregate, pdf export blocked", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx")).toContain(
      'data-testid="compare-run-pickers-same-review-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel.tsx")).toContain(
      'data-testid="compare-search-blocked-not-empty-compare"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx")).toContain(
      'data-testid="compare-pair-blocked-aggregate-not-empty-compare"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-export-pdf-blocked-not-load-failure"',
    );
  });
});
