import { describe, expect, it } from "vitest";

import { buildGetArchLucidCloudPackageCommandLine } from "@/lib/get-archlucid-cloud-package-command";

describe("buildGetArchLucidCloudPackageCommandLine", () => {
  it("emits Azure quick-start by default", () => {
    const line = buildGetArchLucidCloudPackageCommandLine({ platform: "azure" });

    expect(line).toContain("Run-ArchLucidAzureExtractor.ps1");
  });

  it("emits AWS inventory script with output path", () => {
    const line = buildGetArchLucidCloudPackageCommandLine({ platform: "aws" });

    expect(line).toContain("Get-ArchLucidAwsPackage.ps1");
    expect(line).toContain("archlucid-aws-package.zip");
  });

  it("emits GCP inventory script with optional project id", () => {
    const line = buildGetArchLucidCloudPackageCommandLine({
      platform: "gcp",
      scopeId: "my-gcp-project",
    });

    expect(line).toContain("Get-ArchLucidGcpPackage.ps1");
    expect(line).toContain("my-gcp-project");
  });
});
