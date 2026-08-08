/**
 * TB-2099 — forbid dead “review-trail mode” buyer copy on the Evidence graph surface.
 * Tip lived in GraphViewerLegend (deleted with TB-2098); guard keeps the string from returning.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const FORBIDDEN = /review-trail\s*mode/i;

const SCOPED_ROOTS = [
  join(SRC, "app/(operator)/insights/evidence-graph"),
  join(SRC, "components"),
  join(SRC, "lib"),
] as const;

function collectTsFiles(dir: string, acc: string[]): void {
  if (!existsSync(dir)) {
    return;
  }

  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);

    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") {
        continue;
      }

      collectTsFiles(full, acc);
      continue;
    }

    if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
}

describe("TB-2099 review-trail mode tip guard", () => {
  it("forbids buyer-facing review-trail mode copy under graph-related sources", () => {
    const files: string[] = [];

    for (const root of SCOPED_ROOTS) {
      collectTsFiles(root, files);
    }

    const violations: string[] = [];

    for (const file of files) {
      // Guard tests may mention the banned phrase in comments/assertions.
      const normalized = file.replace(/\\/g, "/");

      if (normalized.includes("tb2099-review-trail-mode-guard")) {
        continue;
      }

      const source = readFileSync(file, "utf8");

      if (FORBIDDEN.test(source)) {
        violations.push(normalized.slice(SRC.replace(/\\/g, "/").length + 1));
      }
    }

    expect(violations).toEqual([]);
  });
});
