import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_FORBIDDEN_PATTERNS,
  CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_SCAN_ROOTS,
  CUSTOMER_ARCHITECTURE_ADR_0074_RELATIVE_PATH,
  CUSTOMER_ARCHITECTURE_WORKING_HUB_LIST_MODULE,
} from "@/lib/architecture/customer-architecture-acceptance-inventory";

const UI_SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

function listSourceFilesRecursive(relativeRoot: string): string[] {
  const absoluteRoot = join(UI_SRC_ROOT, relativeRoot);
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current)) {
      const absolutePath = join(current, entry);

      if (statSync(absolutePath).isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (/\.(ts|tsx)$/.test(entry)) {
        if (/\.test\.(ts|tsx)$/.test(entry)) {
          continue;
        }

        files.push(absolutePath);
      }
    }
  }

  walk(absoluteRoot);

  return files;
}

function findForbiddenPatternViolations(
  files: readonly string[],
  patterns: readonly RegExp[],
): string[] {
  const violations: string[] = [];

  for (const filePath of files) {
    const contents = readFileSync(filePath, "utf8");
    const relativePath = filePath.replace(`${UI_SRC_ROOT}/`, "");

    for (const pattern of patterns) {
      if (pattern.test(contents)) {
        violations.push(`${relativePath} matches ${pattern}`);
      }
    }
  }

  return violations;
}

describe("customer-architecture acceptance guard (CA-50)", () => {
  it("ADR 0074 customer-visible architecture identity exists", () => {
    const adrPath = join(REPO_ROOT, CUSTOMER_ARCHITECTURE_ADR_0074_RELATIVE_PATH);

    expect(existsSync(adrPath), CUSTOMER_ARCHITECTURE_ADR_0074_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/customer-visible/i);
    expect(adr).toMatch(/ArchitectureId/i);
  });

  it("Working architectures hub does not mount draft inventory unconditionally", () => {
    const hubSource = readFileSync(join(UI_SRC_ROOT, CUSTOMER_ARCHITECTURE_WORKING_HUB_LIST_MODULE), "utf8");

    expect(hubSource).toContain("isWorkingMode");
    expect(hubSource).toContain("ArchitectureIdentityListClient");
    expect(hubSource).toContain("ArchitectureDraftListClient");
    expect(hubSource).toMatch(/isWorkingMode\s*\?\s*<ArchitectureIdentityListClient/);
  });

  it("operator architecture UI scan roots do not treat DraftId as ArchitectureId", () => {
    const files = CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_SCAN_ROOTS.flatMap((root) =>
      listSourceFilesRecursive(root),
    );
    const violations = findForbiddenPatternViolations(
      files,
      CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_FORBIDDEN_PATTERNS,
    );

    expect(violations).toEqual([]);
  });
});
