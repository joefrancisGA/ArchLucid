import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round92 mounted contract", () => {
  it("trust banner, live region, structured diff, raw manifest", () => {
    expect(readUiSource("components/compare/CompareComparisonTrustBanner.tsx")).toContain(
      'data-testid="compare-trust-banner-current-effective-unsealed-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/use-compare-results-panel.ts")).toContain(
      "COMPARE_LIVE_REGION_STALE_INPUTS_ANNOUNCEMENT",
    );
    expect(readUiSource("components/compare/StructuredComparisonView.tsx")).toContain(
      'data-testid="compare-structured-diff-empty-not-load-failure"',
    );
    expect(readUiSource("components/compare/CompareRawManifestDiffSection.tsx")).toContain(
      'data-testid="compare-raw-manifest-diff-empty-not-load-failure"',
    );
  });
});
