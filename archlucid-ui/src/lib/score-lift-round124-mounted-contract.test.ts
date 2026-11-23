import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round124 mounted contract", () => {
  it("graph focus combinations", () => {
    const graph = readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx");
    expect(graph).toContain('data-testid="evidence-graph-path-only-and-node-focus-combined-empty-not-load-failure"');
    expect(graph).toContain('data-testid="evidence-graph-node-focus-and-edge-focus-combined-empty-not-load-failure"');
    expect(graph).toContain('data-testid="evidence-graph-path-only-and-edge-focus-combined-empty-not-load-failure"');
    expect(graph).toContain('data-testid="evidence-graph-type-node-focus-and-path-only-combined-empty-not-load-failure"');
  });
});
