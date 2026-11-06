import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const FLAT_PEER_FALLBACK_PATTERN =
  /usePathname\s*\(\)\s*\?\?\s*`\/architecture\/reviews\/\$\{/;

function listNonTestTsxUnder(dirRelative: string): string[] {
  const rootDir = join(process.cwd(), dirRelative);
  const files: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) {
        files.push(full);
      }
    }
  }

  walk(rootDir);

  return files;
}

function listComponentTsxFiles(): string[] {
  return listNonTestTsxUnder("src/components");
}

function listOperatorAppTsxFiles(): string[] {
  return listNonTestTsxUnder("src/app/(operator)");
}

describe("flat peer review pathname fallback guard (desk continuity)", () => {
  it("does not regress to flat peer usePathname fallback in URL-sync review actions", () => {
    const files = [
      "ExportTerraformAdvisoryButton.tsx",
      "GenerateAdrFromRunModal.tsx",
      "ReviewBoardWhitelabelConsultingExportButton.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), "src/components", file), "utf8");

      expect(FLAT_PEER_FALLBACK_PATTERN.test(source)).toBe(false);
      expect(source).toContain("resolveReviewUrlStatePathname");
    }
  });

  it("does not add flat peer usePathname fallbacks under src/components (non-test TSX)", () => {
    for (const filePath of listComponentTsxFiles()) {
      const source = readFileSync(filePath, "utf8");

      expect(FLAT_PEER_FALLBACK_PATTERN.test(source)).toBe(false);
    }
  });

  it("does not add flat peer usePathname fallbacks under src/app/(operator) (non-test TSX)", () => {
    for (const filePath of listOperatorAppTsxFiles()) {
      const source = readFileSync(filePath, "utf8");

      expect(FLAT_PEER_FALLBACK_PATTERN.test(source)).toBe(false);
    }
  });
});
