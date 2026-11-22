import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round99 mounted contract", () => {
  it("graph png, diagram renderer, reuse stamp, diagnostic destination", () => {
    const graph = readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx");
    const diagrams = readUiSource("app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx");
    const chain = readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAuthorityChainSection.tsx");
    const banner = readUiSource("components/infra-evidence/InfraEvidenceCompletenessWarningsBanner.tsx");

    expect(graph).toContain('data-testid="graph-png-tainted-not-empty-graph"');
    expect(graph).toContain('data-testid="graph-png-raster-failure-not-empty-graph"');
    expect(diagrams).toContain('data-testid="infra-diagrams-png-server-unavailable"');
    expect(chain).toContain('data-testid="review-graph-snapshot-reuse-observation-stamp"');
    expect(banner).toContain('data-testid="infra-evidence-diagnostic-destination-null-not-empty-list"');
  });
});
