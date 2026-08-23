import { describe, expect, it } from "vitest";

import { EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL } from "@/lib/extract-upload-settings-page-copy";

describe("extract-upload-settings-page-copy guard", () => {
  it("uses cloud-neutral packager script download label (Azure scoped as example)", () => {
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).toMatch(/packager script/i);
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).toMatch(/azure example/i);
    expect(EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL).not.toMatch(/Get-ArchLucidAzurePackage/i);
  });
});
