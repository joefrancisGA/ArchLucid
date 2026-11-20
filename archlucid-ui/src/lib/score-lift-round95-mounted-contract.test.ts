import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round95 mounted contract", () => {
  it("end-to-end export, stale inputs, cite strip, ai narrative", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-end-to-end-export-blocked-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-end-to-end-export-stale-inputs-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/ComparePairEvidenceCiteStrip.tsx")).toContain(
      'data-testid="compare-pair-cite-strip-stale-current-effective"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-ai-narrative-missing-not-load-failure"',
    );
  });
});
