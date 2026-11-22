import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round86 mounted contract", () => {
  it("resource explorer, evidence graph, connection status, findings queue header", () => {
    expect(readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx")).toContain(
      'data-testid="infra-resource-explorer-category-and-name-prefix-combined-filter-empty"',
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      'data-testid="evidence-graph-type-filter-and-node-focus-combined-empty"',
    );
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      'data-testid="connection-status-category-and-subscription-scope-filter-empty"',
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection.tsx")).toContain(
      "GovernanceFindingsQueueHeaderPartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueHeaderPartialCaptureHonesty.tsx")).toContain(
      'data-testid="governance-findings-queue-header-partial-capture"',
    );
  });
});
