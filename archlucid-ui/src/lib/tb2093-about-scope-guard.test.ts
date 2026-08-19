/**
 * TB-2093 — forbid mid-page operator “About …” scope/details collapsibles.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const FORBIDDEN = [
  /title=\{[^}]*SCOPE_DETAILS_TRIGGER[^}]*\}/,
  /title=["']About\s/,
  /collapsibleGuidance=["']About\s/,
  /collapsibleGuidance=\{[^}]*LAYER_GUIDANCE_TRIGGER[^}]*\}/,
  /WebhooksAboutPanel/,
  />\s*About this page\s*</,
] as const;

function collectTsx(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "marketing") {
        continue;
      }

      out.push(...collectTsx(full));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) {
      out.push(full);
    }
  }

  return out;
}

describe("TB-2093 About scope/details guard", () => {
  it("forbids About scope collapsibles and WebhooksAboutPanel outside marketing", () => {
    const violations: string[] = [];
    const roots = [join(SRC_ROOT, "app", "(operator)"), join(SRC_ROOT, "components")].filter((root) => {
      try {
        readdirSync(root);
        return true;
      } catch {
        return false;
      }
    });

    for (const root of roots) {
      for (const absolutePath of collectTsx(root)) {
        const relativePosix = relative(SRC_ROOT, absolutePath).replace(/\\/g, "/");

        if (relativePosix.startsWith("components/marketing/")) {
          continue;
        }

        const source = readFileSync(absolutePath, "utf8");

        for (const pattern of FORBIDDEN) {
          if (pattern.test(source)) {
            violations.push(`${relativePosix}: ${pattern}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
