import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round103 mounted contract", () => {
  it("resource hub, extract pending, reviews hub, governance collection", () => {
    const hub = readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx");
    const extract = readUiSource("app/(operator)/administration/extract-upload/_sections/ExtractUploadAcceptedPackagePanel.tsx");
    const reviews = readUiSource("app/(operator)/architecture/reviews/_sections/RunsPageView.tsx");
    const reviewsHost = readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubOpenGateCollectionBlockerHost.tsx");
    const gov = readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx");

    expect(hub).toContain('data-testid="resource-hub-findings-stored-empty-not-load-failure"');
    expect(extract).toContain('data-testid="extract-upload-evaluation-pending-not-load-failure"');
    expect(reviews).toContain("ReviewsHubOpenGateCollectionBlockerHost");
    expect(reviewsHost).toContain("reviews-hub-open-gate-collection-blocker-not-load-failure");
    expect(gov).toContain('data-testid="governance-findings-empty-collection-blocker-not-load-failure"');
  });
});

