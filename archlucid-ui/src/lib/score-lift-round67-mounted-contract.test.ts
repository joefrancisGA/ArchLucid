import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round67 mounted contract", () => {
  it("hub drift and remediation, search, reviews hub, findings results, approval lineage, audit lineage, impact, scorecard", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-drift-tab-partial-capture");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-remediation-tab-partial-capture");
    expect(readUiSource("app/(operator)/insights/search-review-evidence/_sections/SearchPageView.tsx")).toContain(
      "SearchReviewEvidencePartialEmptyHonesty",
    );
    expect(readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory.tsx")).toContain(
      "ReviewsHubEmptyPartialCaptureHonesty",
    );
    expect(
      readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx"),
    ).toContain("GovernanceFindingsQueueResultsPartialCaptureFootnote");
    expect(
      readUiSource("app/(operator)/governance/approval-requests/[id]/lineage/_sections/GovernanceApprovalLineageDetailContent.tsx"),
    ).toContain("governance-approval-lineage-findings-empty-partial-capture");
    expect(
      readUiSource(
        "app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceControlLineageClient.tsx",
      ),
    ).toContain("AuditEvidenceControlLineagePartialCaptureFootnote");
    expect(readUiSource("app/(operator)/insights/impact-preview/_sections/ImpactPreviewEmptyState.tsx")).toContain(
      "impact-preview-no-baseline-partial-capture",
    );
    expect(readUiSource("app/(operator)/insights/architecture-scorecard/_sections/ReviewScorecardEmptyState.tsx")).toContain(
      "ReviewScorecardEmptyPartialCaptureHonesty",
    );
  });
});