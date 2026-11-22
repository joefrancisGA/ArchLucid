import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round106 mounted contract", () => {
  it("graph node focus, health tiles, deliverables secondary, assigned collection", () => {
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      'data-testid="evidence-graph-node-focus-only-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/administration/system-health/_sections/SystemHealthPageView.tsx")).toContain(
      "perTilePointInTimeHonestyLine={SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE}",
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-deliverables-secondary-exports-finalize-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      'data-testid="governance-assigned-to-me-empty-collection-blocker-not-load-failure"',
    );
  });
});
