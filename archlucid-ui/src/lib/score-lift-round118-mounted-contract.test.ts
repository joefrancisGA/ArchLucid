import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round118 mounted contract", () => {
  it("remediation partial and explorer filter empties", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-remediation-partial-capture-not-load-failure"');
    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    expect(explorer).toContain("resource-explorer-type-and-resource-group-combined-filter-empty-not-load-failure");
    expect(explorer).toContain("resource-explorer-name-prefix-and-resource-group-combined-filter-empty-not-load-failure");
    expect(explorer).toContain("resource-explorer-work-queue-only-filter-empty-not-load-failure");
  });
});
