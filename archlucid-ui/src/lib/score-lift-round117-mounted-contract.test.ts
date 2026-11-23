import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round117 mounted contract", () => {
  it("hub partial gates and more-formats lineage failure", () => {
    const hub = readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx");
    expect(hub).toContain('data-testid="resource-hub-diagram-partial-capture-not-load-failure"');
    expect(hub).toContain('data-testid="resource-hub-config-partial-capture-not-load-failure"');
    expect(hub).toContain('data-testid="resource-hub-drift-partial-capture-not-load-failure"');
    expect(hub).toContain("overviewPartialCapture");
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      'data-testid="golden-manifest-lineage-verify-http-failure-more-formats"',
    );
  });
});
