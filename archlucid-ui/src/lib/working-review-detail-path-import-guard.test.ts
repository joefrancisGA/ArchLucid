import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const UI_SRC_ROOT = join(process.cwd(), "src");

/** Hybrid resolvers may still call reviewDetailPath for Guided fallbacks. */
const REVIEW_DETAIL_PATH_IMPORT_ALLOWLIST: readonly string[] = [
  "lib/architecture/architecture-routes.ts",
  "lib/architecture/working-architecture-review-routes.ts",
  "lib/architecture/architecture-draft-intake-mode.ts",
  "lib/architecture/working-share-href.ts",
  "lib/resolve-audit-trail-review-href.ts",
  "lib/resolve-invite-reviewer-review-href.ts",
  "lib/first-review-guide-status.ts",
  "lib/reviews/review-room-elicitation-url.ts",
  "lib/reviews/review-pin-run-url.ts",
  "lib/buyer/buyer-safe-review-navigation.ts",
  "app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout.tsx",
];

/** Working desk / home / nested-tool surfaces that must mint nested review hrefs (SY-77). */
const WORKING_REVIEW_DETAIL_PATH_DENYLIST: readonly string[] = [
  "components/architecture/ArchitectureIdentityDesk.tsx",
  "components/architecture/ArchitectureIdentityDeskInFlightSection.tsx",
  "components/architecture/ArchitectureIdentityDeskReviewsTable.tsx",
  "components/operator-home/OperatorHomeInFlightReviewsSection.tsx",
  "components/operator-home/OperatorHomeContinueLastReviewPackageSection.tsx",
  "components/operator-home/UnfinishedWorkRail.tsx",
  "components/reviews/ReviewDetailSiblingInFlightQueue.tsx",
  "hooks/use-working-start-href.ts",
  "lib/unfinished-work-rail.ts",
  "lib/reviews-hub-continue-review.ts",
];

function importsReviewDetailPath(source: string): boolean {
  return /\breviewDetailPath\b/.test(source) && /from\s+["']@\/lib\/architecture\/architecture-routes["']/.test(source);
}

describe("working-review-detail-path-import-guard (SY-77)", () => {
  it.each(WORKING_REVIEW_DETAIL_PATH_DENYLIST.map((relativePath) => [relativePath] as const))(
    "%s does not import reviewDetailPath from architecture-routes",
    (relativePath) => {
      const absolutePath = join(UI_SRC_ROOT, relativePath);

      expect(existsSync(absolutePath), relativePath).toBe(true);

      const source = readFileSync(absolutePath, "utf8");

      expect(importsReviewDetailPath(source), relativePath).toBe(false);
    },
  );

  it("documents explicit Guided/buyer allowlist entries for hybrid resolvers", () => {
    for (const relativePath of REVIEW_DETAIL_PATH_IMPORT_ALLOWLIST) {
      expect(existsSync(join(UI_SRC_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
