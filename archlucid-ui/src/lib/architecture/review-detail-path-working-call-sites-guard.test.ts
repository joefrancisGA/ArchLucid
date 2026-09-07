import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const UI_SRC_ROOT = join(process.cwd(), "src");

/** Working production modules that mint review job links — must use nested href helpers (AO-08). */
const WORKING_REVIEW_HREF_MODULES: readonly string[] = [
  "components/reviews/FavoriteReviewsList.tsx",
  "components/governance/RecurrenceScheduleWorkspaceActiveReviewStrip.tsx",
  "components/governance/GovernanceSealedRecordArtifactBreadcrumb.tsx",
  "lib/unfinished-work-rail.ts",
  "lib/reviews-hub-continue-review.ts",
];

describe("reviewDetailPath Working call-site guard (AO-08)", () => {
  it.each(WORKING_REVIEW_HREF_MODULES.map((relativePath) => [relativePath] as const))(
    "%s does not import reviewDetailPath",
    (relativePath) => {
      const absolutePath = join(UI_SRC_ROOT, relativePath);

      expect(existsSync(absolutePath), relativePath).toBe(true);

      const source = readFileSync(absolutePath, "utf8");

      expect(source, relativePath).not.toContain("reviewDetailPath");
      expect(source, relativePath).toContain("resolveWorkingRunReviewLocator");
    },
  );
});
