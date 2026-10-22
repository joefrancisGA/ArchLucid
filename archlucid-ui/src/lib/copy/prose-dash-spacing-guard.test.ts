import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { hasTightProseEmDash } from "@/lib/copy/prose-dash-spacing";

const UI_SRC_ROOT = path.join(process.cwd(), "src");

/** Regex-only matchers that intentionally retain tight dashes to rewrite legacy markdown. */
const TIGHT_EM_DASH_ALLOWLIST_SUFFIXES = [
  "lib/procurement-help-presentation.ts",
  "lib/copy/prose-dash-spacing.ts",
  "lib/copy/prose-dash-spacing.test.ts",
] as const;

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const absolutePath = path.join(dir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") {
        continue;
      }

      collectSourceFiles(absolutePath, acc);
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    acc.push(absolutePath);
  }

  return acc;
}

function isAllowlistedTightDashPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  return TIGHT_EM_DASH_ALLOWLIST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

describe("prose dash spacing guard", () => {
  it("keeps buyer-facing UI copy from gluing em dashes to neighboring words", () => {
    const violations: string[] = [];

    for (const absolutePath of collectSourceFiles(UI_SRC_ROOT)) {
      const relativePath = path.relative(UI_SRC_ROOT, absolutePath);

      if (isAllowlistedTightDashPath(relativePath)) {
        continue;
      }

      const source = readFileSync(absolutePath, "utf8");

      if (!hasTightProseEmDash(source)) {
        continue;
      }

      const lines = source.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (hasTightProseEmDash(line)) {
          violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
