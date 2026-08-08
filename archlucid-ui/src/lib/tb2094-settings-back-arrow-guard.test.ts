/**
 * TB-2094 — forbid page-local ← Settings back arrows under administration/.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const ADMIN_ROOT = join(process.cwd(), "src", "app", "(operator)", "administration");

const FORBIDDEN = [
  /←\s*Settings/,
  /←\s*\{OPERATOR_NAV_LINK_LABELS\.settings\}/,
  /href=["']\/settings#settings-section-/,
] as const;

function collectTsx(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectTsx(full));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) {
      out.push(full);
    }
  }

  return out;
}

describe("TB-2094 administration ← Settings back-arrow guard", () => {
  it("forbids Settings-labeled page-local back arrows under administration/", () => {
    const violations: string[] = [];

    for (const absolutePath of collectTsx(ADMIN_ROOT)) {
      const relativePosix = relative(join(process.cwd(), "src"), absolutePath).replace(/\\/g, "/");
      const source = readFileSync(absolutePath, "utf8");

      for (const pattern of FORBIDDEN) {
        if (pattern.test(source)) {
          violations.push(`${relativePosix}: ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
