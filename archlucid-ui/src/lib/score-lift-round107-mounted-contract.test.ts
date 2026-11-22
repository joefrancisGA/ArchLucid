import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round107 mounted contract", () => {
  it("graph path and edge focus, assigned partial capture, golden manifest markdown", () => {
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      'data-testid="evidence-graph-path-only-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      'data-testid="evidence-graph-edge-focus-only-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      'data-testid="governance-assigned-to-me-empty-partial-capture-not-load-failure"',
    );
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      'data-testid="golden-manifest-markdown-export-finalize-not-load-failure"',
    );
  });
});
