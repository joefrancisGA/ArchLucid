import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  TB_2288_MIGRATED_MODULES,
  TB_2288_DEFERRED_AD_HOC_PILL_MODULES,
} from "@/lib/status-pill-migration-inventory";
import {
  findAdHocStatusPillClassViolations,
  findStatusPillImportViolations,
} from "@/lib/status-pill-drift-source-patterns";

const SRC_ROOT = join(process.cwd(), "src");

const EXCLUDED_RELATIVE_PATHS = new Set([
  "src/lib/status-pill-drift-source-patterns.ts",
  "src/lib/status-pill-migration-inventory.ts",
  "src/lib/status-pill-domain-classes.ts",
  "src/components/StatusPill.tsx",
  "src/lib/design-tokens.ts",
]);

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|tsx)$/;

const AD_HOC_REMEDIATION =
  "Ad-hoc rounded-full status pill classes are banned (TB-2289). Use StatusTag, SeverityTag, or BooleanStatusChip.";

const IMPORT_REMEDIATION =
  "StatusPill imports are banned in production code (TB-2289). Use StatusTag / BooleanStatusChip per TB-2284.";

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

function isAllowlistedAdHocPath(relativePath: string): boolean {
  return TB_2288_DEFERRED_AD_HOC_PILL_MODULES.some((allowed) => relativePath.endsWith(allowed));
}

describe("status pill drift guard (TB-2289)", () => {
  it.each(TB_2288_MIGRATED_MODULES)("migrated module %s does not use ad-hoc status pill classes", (relativePath) => {
    const source = readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");

    expect(findAdHocStatusPillClassViolations(source), AD_HOC_REMEDIATION).toEqual([]);
  });

  it("does not import StatusPill in production modules under src", () => {
    const offenders: string[] = [];

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (EXCLUDED_RELATIVE_PATHS.has(relativePath) || TEST_FILE_PATTERN.test(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const violations = findStatusPillImportViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${IMPORT_REMEDIATION}`);
      }
    }

    expect(offenders, IMPORT_REMEDIATION).toEqual([]);
  });

  it("does not introduce new ad-hoc status pill classes outside the deferred allowlist", () => {
    const offenders: string[] = [];

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (EXCLUDED_RELATIVE_PATHS.has(relativePath) || isAllowlistedAdHocPath(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const violations = findAdHocStatusPillClassViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${AD_HOC_REMEDIATION}`);
      }
    }

    expect(offenders, AD_HOC_REMEDIATION).toEqual([]);
  });
});
