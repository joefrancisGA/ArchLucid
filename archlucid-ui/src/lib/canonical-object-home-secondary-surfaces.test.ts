import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { GOLDEN_PATH_SECONDARY_OBJECT_SURFACES } from "@/lib/canonical-object-home-registry";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const GOLDEN_PATH_HOST_FILES: Record<string, string> = {
  "governance-findings-queue": "src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
  "review-package-findings-tab": "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx",
  "review-package-governance-tab":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailGovernanceDecisionSection.tsx",
  "review-package-authority-chain":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAuthorityChainSection.tsx",
  "finding-evidence-trace": "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectView.tsx",
  "governance-approval-inspector": "src/components/governance/GovernanceApprovalInspectorPreview.tsx",
};

describe("canonical-object-home golden-path secondary surfaces (TB-2153)", () => {
  it("wires each inventory host with a canonical-home strip test id", () => {
    for (const entry of GOLDEN_PATH_SECONDARY_OBJECT_SURFACES) {
      const hostRelativePath = GOLDEN_PATH_HOST_FILES[entry.id];

      expect(hostRelativePath, `missing host file mapping for ${entry.id}`).toBeTruthy();

      const source = readFileSync(join(repoRoot, hostRelativePath), "utf8");

      expect(source).toContain("CanonicalObjectSecondaryViewStrip");
      expect(source).toContain(entry.hostTestId);
    }
  });
});
