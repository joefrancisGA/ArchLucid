import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round100 mounted contract", () => {
  it("manifest lineage, share package, seal delta, compare lifecycle", () => {
    const golden = readUiSource("components/GoldenManifestExportMenu.tsx");
    const share = readUiSource("components/ShareReviewPackageButton.tsx");
    const sealDelta = readUiSource("components/architecture/ArchitectureSealDeltaPanel.tsx");
    const lifecycle = readUiSource(
      "app/(operator)/insights/compare-two-reviews/_sections/CompareFindingLifecycleBlock.tsx",
    );

    expect(golden).toContain('data-testid="golden-manifest-lineage-verify-not-commit-before-seal"');
    expect(golden).toContain('data-testid="golden-manifest-lineage-verify-http-failure"');
    expect(share).toContain('data-testid="share-review-package-post-seal-api-failure"');
    expect(sealDelta).toContain('data-testid="architecture-seal-delta-zero-not-load-failure"');
    expect(sealDelta).toContain('data-testid="architecture-seal-delta-load-failure-not-zero"');
    expect(sealDelta).toContain('data-testid="architecture-seal-delta-single-seal-compare-blocked"');
    expect(lifecycle).toContain('data-testid="compare-finding-lifecycle-status-filter-empty"');
    expect(lifecycle).toContain('data-testid="compare-finding-lifecycle-empty-not-load-failure"');
  });
});
