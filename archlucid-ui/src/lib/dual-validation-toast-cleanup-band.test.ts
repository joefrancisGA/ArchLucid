import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

const TB_2009_SOURCE_ROOTS = [
  "src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx",
  "src/components/wizard/steps/AzureExtractorPackageZipField.tsx",
  "src/app/(operator)/administration/baseline/BaselineSettingsClient.tsx",
] as const;

const TB_2009_BAND_TEST_FILES = [
  "src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.test.tsx",
  "src/components/wizard/steps/AzureExtractorPackageZipField.test.tsx",
  "src/app/(operator)/administration/baseline/page.test.tsx",
] as const;

function readSrc(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

describe("dual validation toast cleanup band regression (TB-2009)", () => {
  it("documents TB-2009 guarded surfaces and sibling Vitest files", () => {
    for (const relativePath of TB_2009_BAND_TEST_FILES) {
      expect(readFileSync(join(UI_ROOT, relativePath), "utf8")).toContain("TB-2009");
    }
  });

  it("does not toast client-known packager validation when inline error state is set", () => {
    const extractUpload = readSrc(TB_2009_SOURCE_ROOTS[0]);

    expect(extractUpload).toContain("setUploadError");
    expect(extractUpload).not.toMatch(/setUploadError\([\s\S]{0,220}showError\("Azure upload"/);

    const zipField = readSrc(TB_2009_SOURCE_ROOTS[1]);

    expect(zipField).toContain("setLocalError");
    expect(zipField).not.toMatch(/setLocalError\([\s\S]{0,120}showError\("Extractor ZIP"/);
  });

  it("does not toast baseline field validation when inline FieldMessage already blocks save", () => {
    const baseline = readSrc(TB_2009_SOURCE_ROOTS[2]);

    expect(baseline).toContain("hasValidationErrors");
    expect(baseline).not.toContain('showError("Baseline", "Fix the highlighted fields before saving.")');
    expect(baseline).not.toContain(
      'showError("Baseline", "Median review-cycle hours must be a positive number up to 10,000.")',
    );
  });
});
