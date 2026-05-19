import { describe, expect, it } from "vitest";

import { buildGetArchLucidAzurePackageCommandLine } from "./get-archlucid-azure-package-command";

describe("buildGetArchLucidAzurePackageCommandLine", () => {
  it("includes V1 standard flags with a placeholder subscription when none is provided", () => {
    const line = buildGetArchLucidAzurePackageCommandLine();

    expect(line).toContain("Get-ArchLucidAzurePackage.ps1");
    expect(line).toContain("-SubscriptionId '<your-subscription-id>'");
    expect(line).toContain("-OutputPath '<path-to-archlucid-azure-package.zip>'");
    expect(line).toContain("-IncludeCost");
    expect(line).toMatch(/^pwsh -NoProfile -ExecutionPolicy Bypass -File/);
  });

  it("prefills -SubscriptionId when a tenant or subscription id is supplied", () => {
    const subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const line = buildGetArchLucidAzurePackageCommandLine({ subscriptionId });

    expect(line).toContain(`-SubscriptionId '${subscriptionId}'`);
    expect(line).toContain("-IncludeCost");
  });
});
