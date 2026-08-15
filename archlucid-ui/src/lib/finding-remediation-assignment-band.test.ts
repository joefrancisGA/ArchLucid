import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const FINDING_REMEDIATION_ASSIGNMENT_BAND_TEST_FILES = [
  "src/lib/api/finding-remediation-assignment-api.ts",
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectGovernanceStickinessPanel.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectGovernanceStickinessPanel.tsx",
] as const;

describe("finding remediation assignment band regression (TB-395)", () => {
  it("keeps sibling Vitest guards for assignee and due date surfaces on disk", () => {
    for (const relativePath of FINDING_REMEDIATION_ASSIGNMENT_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
