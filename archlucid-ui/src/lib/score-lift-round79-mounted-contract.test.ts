import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round79 mounted contract", () => {
  it("reviews package scope, golden disabled export, findings combined register and NL facets", () => {
    expect(readUiSource("app/(operator)/architecture/reviews/RunsListClient.tsx")).toContain(
      "reviews-hub-package-scope-filter-empty",
    );
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      "golden-manifest-export-disabled-while-blocked",
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      "governance-findings-register-and-nl-facet-combined-filter-empty",
    );
  });
});
