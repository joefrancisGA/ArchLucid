import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round81 mounted contract", () => {
  it("findings register plus job view, triple filter, assigned collection preface, orphan context, list context plus search", () => {
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      'data-testid="governance-findings-register-and-job-view-combined-filter-empty"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      'data-testid="governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      'data-testid="governance-assigned-to-me-empty-collection-blocker-preface"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx")).toContain(
      'data-testid="reviews-hub-orphan-candidates-context-filter-empty"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx")).toContain(
      'data-testid="reviews-hub-list-context-and-search-filter-empty"',
    );
  });
});
