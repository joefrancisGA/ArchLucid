import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round96 mounted contract", () => {
  it("workspace unsealed, ai explain blocked, pdf stale, correlation soft failure", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx")).toContain(
      'data-testid="compare-workspace-unsealed-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx")).toContain(
      'data-testid="compare-ai-explain-blocked-not-empty-narrative"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-export-pdf-stale-inputs-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      'data-testid="compare-correlation-soft-failure-not-empty-metadata"',
    );
  });
});
