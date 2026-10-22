import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const ARCH_TAB_PRODUCTION_ALLOWLIST: ReadonlySet<string> = new Set([
  "lib/architecture/architecture-workspace-tabs.ts",
  "lib/unified-review-workspace-tabs.ts",
  "lib/review-detail-workspace-tabs.ts",
  "lib/ui-route-traffic/tab-surface-rows.ts",
]);

const ARCH_TAB_EMIT_PATTERN = /archTab=/;

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

describe("archTab production guard (TB-2363)", () => {
  it("does not emit archTab= in production href builders", () => {
    const offenders = collectSourceFiles(SRC_ROOT)
      .filter((absolute) => ARCH_TAB_EMIT_PATTERN.test(readFileSync(absolute, "utf8")))
      .map(toPosixRelativePath)
      .filter((path) => !ARCH_TAB_PRODUCTION_ALLOWLIST.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });
});
