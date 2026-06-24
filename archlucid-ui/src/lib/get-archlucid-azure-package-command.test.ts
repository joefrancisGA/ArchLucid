import { describe, expect, it } from "vitest";

import {
  buildAdvancedGetArchLucidAzurePackageCommandLine,
  buildGetArchLucidAzurePackageCommandLine,
} from "./get-archlucid-azure-package-command";

describe("buildGetArchLucidAzurePackageCommandLine", () => {
  it("defaults to the one-line quick-start wrapper with no placeholders", () => {
    const line = buildGetArchLucidAzurePackageCommandLine();

    expect(line).toContain("Run-ArchLucidAzureExtractor.ps1");
    expect(line).not.toContain("<your-subscription-id>");
    expect(line).not.toContain("<path-to-archlucid-azure-package.zip>");
    expect(line).toMatch(/^pwsh -NoProfile -ExecutionPolicy Bypass -File/);
  });

  it("prefills -SubscriptionId on the quick-start wrapper when supplied", () => {
    const subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const line = buildGetArchLucidAzurePackageCommandLine({ subscriptionId });

    expect(line).toContain("Run-ArchLucidAzureExtractor.ps1");
    expect(line).toContain(`-SubscriptionId '${subscriptionId}'`);
  });

  it("emits the full extractor command when quickStart is false", () => {
    const line = buildGetArchLucidAzurePackageCommandLine({ quickStart: false });

    expect(line).toContain("Get-ArchLucidAzurePackage.ps1");
    expect(line).toContain("-SubscriptionId '<your-subscription-id>'");
    expect(line).toContain("-OutputPath '.\\archlucid-azure-package.zip'");
    expect(line).toContain("-IncludeCost");
  });

  it("buildAdvancedGetArchLucidAzurePackageCommandLine matches quickStart false", () => {
    const subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const advanced = buildAdvancedGetArchLucidAzurePackageCommandLine({ subscriptionId });

    expect(advanced).toContain("Get-ArchLucidAzurePackage.ps1");
    expect(advanced).toContain(`-SubscriptionId '${subscriptionId}'`);
    expect(advanced).toContain("-IncludeCost");
  });
});
