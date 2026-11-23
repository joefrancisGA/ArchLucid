import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round119 mounted contract", () => {
  it("audit terraform partial, explorer triple, lifecycle status filter", () => {
    const hub = readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx");
    expect(hub).toContain('data-testid="resource-hub-audit-partial-capture-not-load-failure"');
    expect(hub).toContain('data-testid="resource-hub-terraform-not-mapped-partial-capture-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-type-prefix-and-resource-group-filter-empty-not-load-failure");
    expect(
      readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingLifecycleBlock.tsx"),
    ).toContain('data-testid="compare-finding-lifecycle-status-filter-empty-not-load-failure"');
  });
});
