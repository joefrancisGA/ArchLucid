import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round71 mounted contract", () => {
  it("policy catalog, standards catalog, graph type filter, compare zero counts, resource explorer", () => {
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogSection.tsx")).toContain(
      "PolicyPacksCatalogEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/standards-and-rules/_sections/StandardsRulesEmptyState.tsx")).toContain(
      "StandardsRulesCatalogEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      "GraphTypeFilterEmptyPartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      "CompareFindingCorrelationZeroCountsHonesty",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx")).toContain(
      "ResourcesExplorerFilterEmptyPartialHonesty",
    );
  });
});