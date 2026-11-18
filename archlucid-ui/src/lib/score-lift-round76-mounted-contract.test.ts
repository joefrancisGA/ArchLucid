import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round76 mounted contract", () => {
  it("findings nl facets, combined remediation filters, approval list RP, terraform advisory, investigation effort", () => {
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      "GovernanceFindingsNlFacetFilterNoMatchPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx")).toContain(
      "infra-remediation-combined-filter-empty",
    );
    expect(readUiSource("app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx")).toContain(
      "GovernanceWorkflowApprovalsListLoadFailureHonesty",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx")).toContain(
      "infra-terraform-advisory-not-apply-line",
    );
    expect(readUiSource("app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx")).toContain(
      "securenow-investigation-effort-blocking-validation-reason",
    );
  });
});