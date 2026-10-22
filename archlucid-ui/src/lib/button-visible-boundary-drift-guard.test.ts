import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findButtonClassNameColorOverrideViolations,
  findButtonSemanticColorOverrideViolations,
  findButtonVisibleBoundaryViolations,
} from "@/lib/button-visible-boundary-source-patterns";
import { TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST as TB_2295_BUTTON_CLASSNAME_COLOR_INVENTORY } from "@/lib/button-classname-color-override-inventory";

const SRC_ROOT = join(process.cwd(), "src");

/** Pattern definitions and fixture strings — not production Button usage. */
const EXCLUDED_RELATIVE_PATHS = new Set([
  "src/lib/button-visible-boundary-source-patterns.ts",
  "src/lib/button-visible-boundary-source-patterns.test.ts",
]);

/**
 * TB-2295 grandfathered modules — see `button-classname-color-override-inventory.ts`.
 * Shrink that inventory as migrations land; new `Button` color className overrides must not be added elsewhere.
 */
const TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST = new Set(TB_2295_BUTTON_CLASSNAME_COLOR_INVENTORY);

const REMEDIATION =
  "Button ghost/link variants are banned (TB-2168; see docs/library/UI_DESIGN_SYSTEM.md). Use variant=\"outline\" for tertiary actions or OPERATOR_LINK for navigation.";

const SEMANTIC_COLOR_REMEDIATION =
  "Button semantic-color className overrides are banned (TB-2294/TB-2295). Use canonical variants (destructive, outline) or StatusTag/callouts for success/warn/error states.";

const CLASSNAME_COLOR_REMEDIATION =
  "Button className color utilities are banned (TB-2295). Use canonical Button variants; shrink TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST only when migrating a grandfathered file.";

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

  it("does not emit semantic-color Button className overrides anywhere under src (TB-2294/TB-2295)", () => {
    const offenders: string[] = [];

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (EXCLUDED_RELATIVE_PATHS.has(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const violations = findButtonSemanticColorOverrideViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${SEMANTIC_COLOR_REMEDIATION}`);
      }
    }

    expect(offenders, SEMANTIC_COLOR_REMEDIATION).toEqual([]);
  });

  it("does not emit new Button className color overrides outside the TB-2295 allowlist", () => {
    const offenders: string[] = [];

    for (const filePath of collectSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (EXCLUDED_RELATIVE_PATHS.has(relativePath) || TB_2295_BUTTON_CLASSNAME_COLOR_ALLOWLIST.has(relativePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");
      const violations = findButtonClassNameColorOverrideViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${CLASSNAME_COLOR_REMEDIATION}`);
      }
    }

    expect(offenders, CLASSNAME_COLOR_REMEDIATION).toEqual([]);
  });
});
