import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round123 mounted contract", () => {
  it("edge partial and type-filter combinations", () => {
    const graph = readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx");
    expect(graph).toContain("<GraphEdgeFocusOnlyEmptyPartialCaptureHonesty />");
    expect(graph).toContain('data-testid="evidence-graph-type-filter-and-scope-combined-empty-not-load-failure"');
    expect(graph).toContain('data-testid="evidence-graph-type-filter-and-path-only-combined-empty-not-load-failure"');
    expect(graph).toContain('data-testid="evidence-graph-type-filter-and-edge-focus-combined-empty-not-load-failure"');
  });
});
