import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round110 mounted contract", () => {
  it("manifest bundle, review docx, terraform advisory, connection category empty", () => {
    expect(
      readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx"),
    ).toContain('data-testid="run-detail-manifest-bundle-export-finalize-not-load-failure"');
    expect(
      readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx"),
    ).toContain('data-testid="run-detail-architecture-review-docx-export-finalize-not-load-failure"');
    expect(readUiSource("components/ExportTerraformAdvisoryButton.tsx")).toContain(
      'data-testid="export-terraform-advisory-finalize-not-load-failure"',
    );
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      'data-testid="connection-status-category-filter-empty-not-load-failure"',
    );
  });
});
