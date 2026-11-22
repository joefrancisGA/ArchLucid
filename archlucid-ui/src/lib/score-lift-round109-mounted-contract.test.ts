import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round109 mounted contract", () => {
  it("evidence bundle, consulting docx, audit export, reviews hub collection", () => {
    expect(
      readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx"),
    ).toContain('data-testid="run-detail-evidence-bundle-export-finalize-not-load-failure"');
    expect(readUiSource("components/ConsultingDocxExportButton.tsx")).toContain(
      'data-testid="consulting-docx-export-finalize-not-load-failure"',
    );
    expect(readUiSource("components/runs/RunScopedAuditExportButton.tsx")).toContain(
      'data-testid="run-scoped-audit-export-finalize-not-load-failure"',
    );
    expect(
      readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubOpenGateCollectionBlockerHost.tsx"),
    ).toContain('notLoadFailureTestId="reviews-hub-open-gate-collection-blocker-not-load-failure"');
  });
});
