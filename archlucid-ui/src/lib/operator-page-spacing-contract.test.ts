import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_PAGE_MARKETING_SCALE_SPACING_BASELINE_PATHS } from "@/lib/operator/operator-page-spacing-baseline";

const OPERATOR_APP_ROOT = join(process.cwd(), "src", "app", "(operator)");

/**
 * Help guides and auth flows are prose or centred shells — not operator page chrome density.
 */
const EXEMPT_PREFIXES: readonly string[] = ["app/(operator)/help/", "app/(operator)/auth/"];

const MARKETING_SCALE_SPACING_BASELINE: ReadonlySet<string> = new Set(
  OPERATOR_PAGE_MARKETING_SCALE_SPACING_BASELINE_PATHS,
);

const MARKETING_SCALE_SPACING_PATTERN = /\bspace-y-[68]\b|\bpy-8\b/;

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(join(process.cwd(), "src"), absolute).split("\\").join("/");
}

function usesMarketingScaleSpacing(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return MARKETING_SCALE_SPACING_PATTERN.test(source);
}

describe("operator page spacing (TB-2390)", () => {
  it("keeps marketing-scale section gaps inside the frozen baseline", () => {
    const offenders = collectComponentFiles(OPERATOR_APP_ROOT)
      .filter(usesMarketingScaleSpacing)
      .map(toPosixRelativePath)
      .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !MARKETING_SCALE_SPACING_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...MARKETING_SCALE_SPACING_BASELINE]
      .filter((path) => !usesMarketingScaleSpacing(join(process.cwd(), "src", path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
