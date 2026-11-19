import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round75 mounted contract", () => {
  it("ranked path chips, approval filter empty, wave filter empty, investigation effort labels", () => {
    expect(readUiSource("components/security/SecurityEvidencePathRankSortKeyDisclosure.tsx")).toContain(
      "formatAttackPathReportPathChipLabel",
    );
    expect(readUiSource("app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx")).toContain(
      "GovernanceWorkflowApprovalsStatusFilterBar",
    );
    expect(readUiSource("app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx")).toContain(
      "governance-approval-status-filter-empty",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx")).toContain(
      "infra-remediation-wave-filter-empty",
    );
    expect(readUiSource("app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx")).toContain(
      "SecureNowInvestigationEffortMissingFieldLabelsLine",
    );
  });
});