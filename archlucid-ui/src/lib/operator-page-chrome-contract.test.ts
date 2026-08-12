import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");
const OPERATOR_ROOT = join(SRC_ROOT, "app", "(operator)");

/**
 * Auth flow screens render inside `AuthFlowShell`, not the operator page shell, so they own their
 * own centred chrome and are outside this convention.
 */
const EXEMPT_PREFIXES: readonly string[] = ["app/(operator)/auth/"];

/**
 * Operator page views still hand-rolling a page title (TB-2377 ratchet baseline).
 *
 * Each of these picks its own title margin — `m-0`, `mt-0`, `mb-4`, or none — so vertical rhythm
 * above the first content block differs page to page. `OperatorPageHeader` owns that spacing plus
 * the subtitle measure, actions row, and bottom rule. This list may shrink but must never grow.
 */
const HAND_ROLLED_PAGE_TITLE_BASELINE: ReadonlySet<string> = new Set([]);

function collectPageViews(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectPageViews(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function handRollsPageTitle(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return /<h1[\s>]/.test(source) && /OPERATOR_TYPOGRAPHY\.pageTitle/.test(source);
}

describe("operator page chrome (TB-2377)", () => {
  it("keeps hand-rolled page titles inside the frozen baseline", () => {
    const offenders = collectPageViews(OPERATOR_ROOT)
      .filter(handRollsPageTitle)
      .map(toPosixRelativePath)
      .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !HAND_ROLLED_PAGE_TITLE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...HAND_ROLLED_PAGE_TITLE_BASELINE]
      .filter((path) => !handRollsPageTitle(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
