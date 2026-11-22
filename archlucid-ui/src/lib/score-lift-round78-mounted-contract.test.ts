import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round78 mounted contract", () => {
  it("golden blocked commit-first, reviews search, register filter, graph RP, pack detail RP", () => {
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      "golden-manifest-export-blocked-commit-before-seal",
    );
    expect(readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx")).toContain(
      "reviews-hub-search-filter-empty",
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      "governance-findings-register-filter-empty-not-load-failure",
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphBuyerEvidenceTrailError.tsx")).toContain(
      "governance-evidence-graph-hard-failure",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/[id]/PolicyPackDetailLoadError.tsx")).toContain(
      "policy-pack-detail-load-failure-partial-capture",
    );
  });
});
