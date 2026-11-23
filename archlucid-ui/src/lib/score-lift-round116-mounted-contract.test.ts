import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round116 mounted contract", () => {
  it("explorer filters, compare one finalized, hub findings partial", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-category-only-filter-empty-not-load-failure");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-resource-group-only-filter-empty-not-load-failure");
    expect(
      readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState.tsx"),
    ).toContain("compare-insufficient-finalized-one-finalized-second-empty-not-load-failure");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-findings-partial-capture-not-load-failure"');
  });
});
