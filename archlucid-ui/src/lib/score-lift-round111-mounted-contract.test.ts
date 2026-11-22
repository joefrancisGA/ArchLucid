import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round111 mounted contract", () => {
  it("server markdown, hub config, compare partial capture, connection subscription category", () => {
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      'data-testid="golden-manifest-server-markdown-export-finalize-not-load-failure"',
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-config-stored-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPartialInventoryFootnote.tsx"),
    ).toContain('data-testid="compare-quality-delta-partial-capture-not-load-failure"');
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      'data-testid="connection-status-category-and-subscription-scope-filter-empty-not-load-failure"',
    );
  });
});
