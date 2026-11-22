import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round80 mounted contract", () => {
  it("operator home collection, findings job plus NL, reviews list context, workspace health refresh, policy assignments empty", () => {
    expect(readUiSource("components/operator-home/OperatorHomeSecureNowCollectionBlockerStrip.tsx")).toContain(
      "operator-home-open-gate-collection-blocker",
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      'data-testid="governance-findings-job-view-and-nl-facet-combined-filter-empty"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx")).toContain(
      'data-testid="reviews-hub-list-context-filter-empty"',
    );
    expect(readUiSource("components/governance/SponsorWorkspaceHealthPageHero.tsx")).toContain(
      "sponsor-workspace-health-page-refresh-discipline",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksFeaturedSection.tsx")).toContain(
      "policy-pack-hub-workspace-assignments-empty",
    );
  });
});
