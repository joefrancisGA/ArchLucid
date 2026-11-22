import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round114 mounted contract", () => {
  it("hub overview partial, golden server primary, explorer combined, digests subscription", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-overview-partial-capture-not-load-failure"');
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      'data-testid="golden-manifest-server-markdown-export-finalize-not-load-failure"',
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-category-and-name-prefix-combined-filter-empty-not-load-failure");
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain(
      'data-testid="digests-browse-subscription-list-only-empty-not-load-failure"',
    );
  });
});
