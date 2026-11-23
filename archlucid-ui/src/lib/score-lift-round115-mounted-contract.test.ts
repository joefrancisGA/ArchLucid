import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round115 mounted contract", () => {
  it("hub overview partial gate, explorer filters, buyer bundle", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("overviewPartialCapture");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-category-only-filter-empty-not-load-failure");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx"),
    ).toContain("resource-explorer-name-prefix-only-filter-empty-not-load-failure");
    expect(readUiSource("components/ManifestBuyerBundleDownloadSection.tsx")).toContain(
      'data-testid="manifest-buyer-bundle-export-finalize-not-load-failure"',
    );
  });
});
