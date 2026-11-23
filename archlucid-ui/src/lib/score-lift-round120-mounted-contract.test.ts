import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round120 mounted contract", () => {
  it("explorer work-queue pairs and subscription-scope empty", () => {
    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    expect(explorer).toContain('data-testid="resource-explorer-resource-group-and-work-queue-filter-empty-not-load-failure"');
    expect(explorer).toContain('data-testid="resource-explorer-type-and-work-queue-filter-empty-not-load-failure"');
    expect(explorer).toContain('data-testid="resource-explorer-name-prefix-and-work-queue-filter-empty-not-load-failure"');
    expect(explorer).toContain('urlWorkQueue === "all"');
    expect(
      readUiSource("components/integrations/ConnectorOperationsDashboard.tsx"),
    ).toContain('data-testid="connection-status-subscription-scope-only-filter-empty-not-load-failure"');
  });
});
