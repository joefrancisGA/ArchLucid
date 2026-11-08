import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const UI_SRC = join(process.cwd(), "src");

/** Allowed modules that define or centrally wrap peer review paths. */
const REVIEW_DETAIL_PATH_ALLOWLIST_SUFFIXES = [
  "architecture/architecture-routes.ts",
  "architecture/working-architecture-review-routes.ts",
  "architecture/review-workspace-route.ts",
  "architecture/resolve-desk-continuity-review-href.ts",
  "architecture/working-share-href.ts",
  "architecture/architecture-draft-intake-mode.ts",
  "buyer/buyer-safe-review-navigation.ts",
  "first-review-guide-status.ts",
  "resolve-audit-trail-review-href.ts",
  "resolve-invite-reviewer-review-href.ts",
  "review-detail-workspace-tabs.ts",
  "reviews/review-pin-run-url.ts",
  "reviews/review-room-elicitation-url.ts",
  "system-not-job-portfolio-resume-href.ts",
] as const;

/** TSX call sites tracked for migration — new peer-only usages should not be added. */
const REVIEW_DETAIL_PATH_TSX_ALLOWLIST_SUFFIXES = [
  "app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout.tsx",
] as const;

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function isAllowlisted(filePath: string): boolean {
  const rel = relative(UI_SRC, filePath).replaceAll("\\", "/");

  if (rel.includes(".test.")) {
    return true;
  }

  if (REVIEW_DETAIL_PATH_ALLOWLIST_SUFFIXES.some((suffix) => rel.endsWith(suffix))) {
    return true;
  }

  return REVIEW_DETAIL_PATH_TSX_ALLOWLIST_SUFFIXES.some((suffix) => rel.endsWith(suffix));
}

function walkSourceFiles(dir: string, acc: string[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);

    if (st.isDirectory()) {
      if (name === "api-types") {
        continue;
      }

      walkSourceFiles(full, acc);

      continue;
    }

    const ext = name.slice(name.lastIndexOf("."));

    if (!SOURCE_EXTENSIONS.has(ext)) {
      continue;
    }

    acc.push(full);
  }
}

describe("reviewDetailPath call-site guard", () => {
  it("limits reviewDetailPath( to route modules and approved wrappers", () => {
    const files: string[] = [];

    walkSourceFiles(UI_SRC, files);

    const offenders: string[] = [];

    for (const file of files) {
      if (isAllowlisted(file)) {
        continue;
      }

      const body = readFileSync(file, "utf8");

      if (body.includes("reviewDetailPath(")) {
        offenders.push(relative(UI_SRC, file).replaceAll("\\", "/"));
      }
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Use buildReviewWorkspaceRouteHref / resolveDeskContinuityReviewOpenHref instead:\n${offenders.join("\n")}`
        : undefined,
    ).toEqual([]);
  });
});
