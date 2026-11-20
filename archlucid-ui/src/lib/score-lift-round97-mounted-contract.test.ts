import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round97 mounted contract", () => {
  it("docx stale, manifest stale, drift hard failure, ai malformed", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-export-docx-stale-inputs-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx")).toContain(
      'data-testid="compare-manifest-export-stale-inputs-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel.tsx")).toContain(
      'data-testid="compare-drift-download-hard-failure-not-empty-artifact"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx")).toContain(
      'data-testid="compare-ai-malformed-not-blocked-explain"',
    );
  });
});
