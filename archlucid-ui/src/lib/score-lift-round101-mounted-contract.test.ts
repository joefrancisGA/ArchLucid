import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round101 mounted contract", () => {
  it("uncited band, hide generic, lifecycle hash, last-visit restore", () => {
    const findings = readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx");
    const governance = readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx");
    const tabShell = readUiSource("components/reviews/ReviewDetailWorkspaceTabShell.tsx");

    expect(findings).toContain('data-testid="review-uncited-band-empty-not-load-failure"');
    expect(findings).toContain('data-testid="review-findings-last-visit-restore-not-load-failure"');
    expect(governance).toContain('data-testid="governance-findings-hide-generic-filter-empty"');
    expect(tabShell).toContain('data-testid="review-lifecycle-tab-hash-restored-not-load-failure"');
  });
});
