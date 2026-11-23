import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round121 mounted contract", () => {
  it("explorer work-queue triples and attack-path diagram filter", () => {
    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    expect(explorer).toContain('data-testid="resource-explorer-work-queue-type-and-name-prefix-filter-empty-not-load-failure"');
    expect(explorer).toContain('data-testid="resource-explorer-work-queue-type-and-resource-group-filter-empty-not-load-failure"');
    expect(explorer).toContain('data-testid="resource-explorer-work-queue-name-prefix-and-resource-group-filter-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx"),
    ).toContain('data-testid="attack-path-report-diagram-filter-empty-not-load-failure"');
  });
});
