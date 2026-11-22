import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round108 mounted contract", () => {
  it("findings partial capture, deliverables exports, workspace kpi tiles", () => {
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      'data-testid="governance-findings-empty-partial-capture-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-architecture-request-json-finalize-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-review-export-zip-finalize-not-load-failure"',
    );
    expect(readUiSource("components/SponsorWorkspaceHealthKpiBlocks.tsx")).toContain(
      'data-testid="workspace-health-kpi-tiles-point-in-time-not-load-failure"',
    );
  });
});
