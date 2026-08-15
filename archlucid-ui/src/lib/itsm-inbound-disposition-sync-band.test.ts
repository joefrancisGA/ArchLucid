import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ITSM_INBOUND_DISPOSITION_SYNC_BAND_TEST_FILES = [
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectItsmWorkflowPanel.test.tsx",
  "src/lib/findings/finding-human-review-display.ts",
] as const;

describe("itsm inbound disposition sync band regression (TB-396)", () => {
  it("keeps sibling Vitest guards for inbound disposition honesty on disk", () => {
    for (const relativePath of ITSM_INBOUND_DISPOSITION_SYNC_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
