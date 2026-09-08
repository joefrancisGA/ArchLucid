import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_ACCEPTED_FORMAT_ARCHITECTURE,
  EXTRACT_UPLOAD_ACCEPTED_FORMAT_SECURITY,
  extractUploadAcceptedFormatDetail,
  extractUploadCloudInventoryCheckoutLead,
  extractUploadPackagerScriptReference,
  extractUploadQuickStartDescription,
} from "@/lib/extract-upload-product-copy";

describe("extractUploadProductCopy", () => {
  it("localizes checkout wording for SecureNow", () => {
    expect(extractUploadQuickStartDescription("architecture")).toContain("ArchLucid checkout");
    expect(extractUploadQuickStartDescription("security")).toContain("SecureNow checkout");
    expect(extractUploadQuickStartDescription("security")).not.toMatch(/\bArchLucid\b/);

    expect(extractUploadCloudInventoryCheckoutLead("architecture")).toContain("ArchLucid checkout");
    expect(extractUploadCloudInventoryCheckoutLead("security")).toContain("SecureNow checkout");
    expect(extractUploadCloudInventoryCheckoutLead("security")).not.toMatch(/\bArchLucid\b/);
  });

  it("uses cloud-neutral accepted-format copy on SecureNow", () => {
    expect(extractUploadAcceptedFormatDetail("architecture")).toBe(EXTRACT_UPLOAD_ACCEPTED_FORMAT_ARCHITECTURE);
    expect(extractUploadAcceptedFormatDetail("security")).toBe(EXTRACT_UPLOAD_ACCEPTED_FORMAT_SECURITY);
    expect(extractUploadAcceptedFormatDetail("security")).not.toMatch(/\bArchLucid\b/);
  });

  it("uses cloud-neutral packager script references on SecureNow", () => {
    expect(extractUploadPackagerScriptReference("architecture")).toBe("Get-ArchLucidAzurePackage.ps1");
    expect(extractUploadPackagerScriptReference("security")).toBe("the cloud inventory packager script");
  });
});
