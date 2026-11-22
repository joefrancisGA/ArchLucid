import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round88 mounted contract", () => {
  it("insufficient finalized, classification band, digest delivery, assigned scope", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState.tsx")).toContain(
      'data-testid="compare-insufficient-finalized-one-finalized-second-empty"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareClassificationBandDeltaPanel.tsx")).toContain(
      'data-testid="compare-classification-band-zero-counts-one-unsealed"',
    );
    expect(readUiSource("components/digests/DigestsBrowseDetailPanel.tsx")).toContain(
      'data-testid="digests-browse-delivery-attempts-empty"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      "governance-findings-assigned-to-me-architecture-scope-only-filter-empty",
    );
  });
});
