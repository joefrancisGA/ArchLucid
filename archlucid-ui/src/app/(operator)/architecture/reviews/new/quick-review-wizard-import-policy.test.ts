import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REVIEWS_NEW_ROOT = join(process.cwd(), "src", "app", "(operator)", "architecture", "reviews", "new");
const SRC_ROOT = join(process.cwd(), "src");

const QUICK_REVIEW_WIZARD_IMPORT_RE =
  /from\s+["'][^"']*QuickReviewWizard(?:\.tsx)?["']|import\s*\(\s*["'][^"']*QuickReviewWizard(?:\.tsx)?["']\s*\)/;

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

function filesImportingQuickReviewWizard(sourceFiles: string[]): string[] {
  return sourceFiles.filter((filePath) => {
    const source = readFileSync(filePath, "utf8");

    return QUICK_REVIEW_WIZARD_IMPORT_RE.test(source);
  });
}

describe("quick-review wizard import policy (TB-1873)", () => {
  it("does not ship a routable QuickReviewWizard module under reviews/new", () => {
    expect(existsSync(join(REVIEWS_NEW_ROOT, "QuickReviewWizard.tsx"))).toBe(false);
    expect(existsSync(join(REVIEWS_NEW_ROOT, "QuickReviewWizard.test.tsx"))).toBe(false);
  });

  it("routes Quick start through FirstPilotIntakeWizard only", () => {
    const pathSwitcherSource = readFileSync(join(REVIEWS_NEW_ROOT, "ReviewsNewPathSwitcher.tsx"), "utf8");
    const ownEvidenceSource = readFileSync(join(REVIEWS_NEW_ROOT, "ReviewsNewOwnEvidenceStart.tsx"), "utf8");

    expect(pathSwitcherSource).toContain("FirstPilotIntakeWizard");
    expect(pathSwitcherSource).not.toMatch(QUICK_REVIEW_WIZARD_IMPORT_RE);
    expect(ownEvidenceSource).toContain("FirstPilotIntakeWizard");
    expect(ownEvidenceSource).not.toMatch(QUICK_REVIEW_WIZARD_IMPORT_RE);
  });

  it("forbids QuickReviewWizard imports anywhere in src", () => {
    const importers = filesImportingQuickReviewWizard(collectSourceFiles(SRC_ROOT));

    expect(importers).toEqual([]);
  });
});
