import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round64 mounted contract", () => {
  it("exports, compare pickers, hub, factory, digest, first review", () => {
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      "golden-manifest-export-partial-capture-recovery",
    );
    expect(
      readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx"),
    ).toContain("run-detail-deliverables-partial-capture-recovery");
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx")).toContain(
      "CompareRunPickersPartialInventoryFootnote",
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-findings-empty-partial-capture");
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "remediation-factory-priority-queue-partial-rank",
    );
    expect(readUiSource("components/digests/DigestSubscriptionList.tsx")).toContain(
      "digest-subscriptions-vs-browse-empty-honesty",
    );
    expect(
      readUiSource("app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx"),
    ).toContain("FIRST_REVIEW_PARTIAL_CAPTURE_DISABLED_CTA_LINE");
  });
});