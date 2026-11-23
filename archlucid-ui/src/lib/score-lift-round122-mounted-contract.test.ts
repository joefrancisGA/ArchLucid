import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round122 mounted contract", () => {
  it("explorer quadruple and graph partial capture", () => {
    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    expect(explorer).toContain('data-testid="resource-explorer-work-queue-type-prefix-and-resource-group-filter-empty-not-load-failure"');
    expect(explorer).toContain('urlResourceType.length > 0 && urlNamePrefix.length > 0 && urlResourceGroup.length > 0 && urlWorkQueue === "all"');
    const graph = readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx");
    expect(graph).toContain('data-testid="evidence-graph-node-focus-only-empty-partial-capture"');
    expect(graph).toContain('data-testid="evidence-graph-path-only-empty-partial-capture"');
  });
});
