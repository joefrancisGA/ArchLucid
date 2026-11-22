import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round89 mounted contract", () => {
  it("semantic support band, treatment band, governance diff empty, stale inputs", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareSemanticSupportBandDeltaPanel.tsx")).toContain(
      'data-testid="compare-semantic-support-band-zero-counts-one-unsealed"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareTreatmentBandDeltaPanel.tsx")).toContain(
      'data-testid="compare-treatment-band-zero-counts-one-unsealed"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel.tsx")).toContain(
      'data-testid="compare-governance-diff-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx")).toContain(
      'data-testid="compare-results-stale-inputs-not-load-failure"',
    );
  });
});
