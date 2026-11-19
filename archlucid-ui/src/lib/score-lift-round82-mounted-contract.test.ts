import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round82 mounted contract", () => {
  it("reviews combined empties, findings empty preface, combined filter legend", () => {
    const runs = readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx");
    expect(runs).toContain('data-testid="reviews-hub-list-context-and-package-scope-filter-empty"');
    expect(runs).toContain('data-testid="reviews-hub-orphan-candidates-and-search-filter-empty"');
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      'data-testid="governance-findings-empty-collection-blocker-preface"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      'data-testid="governance-findings-combined-filter-mode-legend"',
    );
  });
});
