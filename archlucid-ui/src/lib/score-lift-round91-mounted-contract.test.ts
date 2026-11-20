import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round91 mounted contract", () => {
  it("verdict add remove, execution mode, provenance partial, agent empty", () => {
    expect(readUiSource("components/compare/CompareVerdictSummary.tsx")).toContain(
      'data-testid="compare-verdict-add-remove-two-sealed-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareExecutionModeDeltaPanel.tsx")).toContain(
      'data-testid="compare-execution-mode-one-unsealed-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareProvenanceDeltaBand.tsx")).toContain(
      'data-testid="compare-provenance-delta-partial-inventory-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareAgentResultsBlockedCallout.tsx")).toContain(
      'compare-agent-results-empty-not-load-failure',
    );
  });
});
