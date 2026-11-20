import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round94 mounted contract", () => {
  it("docx blocked, drift blocked, zero finalized, manifest export blocked", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-export-docx-blocked-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel.tsx")).toContain(
      'data-testid="compare-drift-download-blocked-not-empty-compare"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState.tsx")).toContain(
      'data-testid="compare-insufficient-finalized-zero-finalized-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-manifest-export-blocked-not-load-failure"',
    );
  });
});
