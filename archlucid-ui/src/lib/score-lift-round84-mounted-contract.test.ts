import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round84 mounted contract", () => {
  it("compare second seal, deliverables finalize, resource hub architecture stream", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      'data-testid="compare-correlation-empty-and-second-seal"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-deliverables-blocked-export-finalize-and-partial-capture"',
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx")).toContain(
      'data-testid="infra-resource-hub-findings-architecture-scope-and-severity-empty"',
    );
  });
});
