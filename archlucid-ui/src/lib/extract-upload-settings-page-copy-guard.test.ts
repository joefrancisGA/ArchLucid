import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_CLOUD_NEUTRAL_BANNED_PHRASES,
  EXTRACT_UPLOAD_CLOUD_NEUTRAL_COPY_SURFACES,
  listExtractUploadSettingsPageCopyViolations,
} from "@/lib/extract-upload-settings-page-copy-guard";
import {
  EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL,
  extractUploadAdvancedCommandDisclosureSummary,
  extractUploadScriptDownloadLabel,
} from "@/lib/extract-upload-settings-page-copy";

describe("extract-upload-settings-page-copy guard", () => {
  it("keeps primary extract-upload copy free of Azure-default bias phrases", () => {
    expect(listExtractUploadSettingsPageCopyViolations()).toEqual([]);
  });

  it("documents banned phrase inventory for reviewers", () => {
    expect(EXTRACT_UPLOAD_CLOUD_NEUTRAL_BANNED_PHRASES.length).toBeGreaterThanOrEqual(6);
  });

  it("uses cloud-neutral packager script download label (Azure scoped as example)", () => {
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).toBe(
      EXTRACT_UPLOAD_CLOUD_NEUTRAL_COPY_SURFACES.scriptDownloadLabel,
    );
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).toMatch(/packager script/i);
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).toMatch(/azure example/i);
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).not.toMatch(/Get-ArchLucidAzurePackage/i);
  });

  it("removes Azure example qualifiers from SecureNow copy", () => {
    expect(extractUploadAdvancedCommandDisclosureSummary("security")).toBe(
      "Advanced: full inventory packager command",
    );
    expect(extractUploadScriptDownloadLabel("security")).toBe("Download packager script");
  });
});
