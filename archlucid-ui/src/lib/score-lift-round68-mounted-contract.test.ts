import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round68 mounted contract", () => {
  it("approval queue, needs attention, hub config, remediation waves, digests, audit lookup, compare, sealed records", () => {
    expect(readUiSource("app/(operator)/governance/_sections/GovernanceWorkflowApprovalsEmpty.tsx")).toContain(
      "GovernanceWorkflowApprovalsEmptyPartialHonesty",
    );
    expect(
      readUiSource("app/(operator)/governance/needs-attention/_sections/NeedsAttentionInboxPageClient.tsx"),
    ).toContain("NeedsAttentionInboxAllClearPartialHonesty");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-config-empty-partial-capture");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx"),
    ).toContain("RemediationWorkbenchWavesEmptyPartialHonesty");
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain("DigestsBrowseSetupEmptyPartialHonesty");
    expect(readUiSource("app/(operator)/governance/audit-evidence/AuditEvidenceLookupClient.tsx")).toContain(
      "AuditEvidenceLookupPartialCaptureFootnote",
    );
    expect(
      readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState.tsx"),
    ).toContain("CompareInsufficientFinalizedPartialCaptureHonesty");
    expect(readUiSource("app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient.tsx")).toContain(
      "SignedRecordsListPartialCaptureFootnote",
    );
  });
});