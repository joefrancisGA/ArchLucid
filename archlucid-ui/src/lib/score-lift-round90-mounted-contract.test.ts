import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round90 mounted contract", () => {
  it("roi headline, gate outcome, pack assignment, correlation unsealed", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRoiHeadlineDeltaPanel.tsx")).toContain(
      'data-testid="compare-roi-headline-zero-estimates-one-unsealed"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareGateOutcomeDeltaPanel.tsx")).toContain(
      'data-testid="compare-gate-outcome-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/ComparePackAssignmentDeltaPanel.tsx")).toContain(
      'data-testid="compare-pack-assignment-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      'data-testid="compare-correlation-empty-one-unsealed-not-load-failure"',
    );
  });
});
