import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const SRC_ROOT = join(process.cwd(), "src");

/** Pattern definitions embed ghost/link literals — not production Button usage. */
const EXCLUDED_RELATIVE_PATHS = new Set(["src/lib/button-visible-boundary-source-patterns.ts"]);

const REMEDIATION =
  "Button ghost/link variants are banned (TB-2168; see docs/library/UI_DESIGN_SYSTEM.md). Use variant=\"outline\" for tertiary actions or OPERATOR_LINK for navigation.";

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));

      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe("button visible-boundary drift guard (TB-2174)", () => {
  it("does not emit ghost/link Button variants anywhere under src", () => {
    const offenders: string[] = [];

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (EXCLUDED_RELATIVE_PATHS.has(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const violations = findButtonVisibleBoundaryViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${REMEDIATION}`);
      }
    }

    expect(offenders, REMEDIATION).toEqual([]);
  });

  it("does not flag non-Button component props such as CtoDemoHowItWorksTrigger variant=\"link\"", () => {
    const source = readFileSync(
      join(SRC_ROOT, "components/cto-demo/CtoDemoSponsorTenantIsolationCallout.tsx"),
      "utf8",
    );

    expect(findButtonVisibleBoundaryViolations(source)).toEqual([]);
  });
});
