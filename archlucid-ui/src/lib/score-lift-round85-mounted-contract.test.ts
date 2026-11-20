import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round85 mounted contract", () => {
  it("compare pickers, deliverables blocked buttons, operational stream, findings scope and severity", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx")).toContain(
      'data-testid="compare-run-pickers-second-review-not-sealed"',
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx")).toContain(
      'data-testid="compare-run-pickers-correlation-empty-and-seal"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-evidence-bundle-export-blocked-finalize-partial"',
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx")).toContain(
      'data-testid="infra-resource-hub-findings-operational-security-stream-empty"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      'data-testid="governance-findings-architecture-scope-and-severity-combined-filter-empty"',
    );
  });
});
