import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const REVIEW_WORKSPACE_TAB_STRIP_ALLOWLIST: ReadonlySet<string> = new Set([
  "components/reviews/ReviewWorkspaceTabStrip.tsx",
]);

const TAB_STRIP_SOURCE_OF_TRUTH_PATTERNS: readonly RegExp[] = [
  /data-testid=\{REVIEW_WORKSPACE_TAB_STRIP_TEST_ID\}/,
  /data-testid="review-detail-workspace-tabs"/,
  /aria-label="Review workspace sections"/,
  /aria-label="Architecture workspace sections"/,
];

function collectSourceFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectSourceFiles(absolute));
      continue;
    }

    if ((extname(absolute) === ".ts" || extname(absolute) === ".tsx") && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

describe("review workspace tab strip guard (TB-2367)", () => {
  it("forbids a second tab list source of truth outside ReviewWorkspaceTabStrip", () => {
    const offenders = collectSourceFiles(SRC_ROOT)
      .map((absolute) => ({
        path: toPosixRelativePath(absolute),
        source: readFileSync(absolute, "utf8"),
      }))
      .filter(
        ({ path, source }) =>
          !REVIEW_WORKSPACE_TAB_STRIP_ALLOWLIST.has(path)
          && TAB_STRIP_SOURCE_OF_TRUTH_PATTERNS.some((pattern) => pattern.test(source)),
      )
      .map(({ path }) => path)
      .sort();

    expect(offenders).toEqual([]);
  });
});
