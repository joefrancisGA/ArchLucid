import { describe, expect, it } from "vitest";

import {
  buildTier2AzureSetupScript,
  TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT,
} from "./tier2-connection-wizard-content";
import { AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE } from "@/lib/azure-cloud-connection-copy";

describe("buildTier2AzureSetupScript", () => {
  it("surfaces replaceable ArchLucid identity variables at the top of the script", () => {
    const script = buildTier2AzureSetupScript();

    expect(script.indexOf("SUBSCRIPTION_ID=")).toBeLessThan(script.indexOf("az ad sp create-for-rbac"));
    expect(script).toContain("# Azure read-only extractor — customer tenant setup (Azure CLI)");
    expect(script).not.toMatch(/Tier\s*2/i);
    expect(script).toContain('SUBSCRIPTION_ID="YOUR_SUBSCRIPTION_ID"');
    expect(script).toContain('ARCHLUCID_TENANT_ID="YOUR_ARCHLUCID_TENANT_ID"');
    expect(script).toContain(
      'ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID"',
    );
    expect(script).toContain("${ARCHLUCID_TENANT_ID}");
    expect(script).toContain("${ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID}");
    expect(script).toContain("Optional — Cost Management Reader");
    expect(script).toContain(AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE);
    expect(script).toMatch(/# az role assignment create .*Cost Management Reader/);
    expect(TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT).toContain("ARCHLUCID_TENANT_ID");
    expect(TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT).toContain("ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID");
  });

  it("accepts a concrete subscription id for the SUBSCRIPTION_ID assignment", () => {
    const script = buildTier2AzureSetupScript("11111111-2222-3333-4444-555555555555");

    expect(script).toContain('SUBSCRIPTION_ID="11111111-2222-3333-4444-555555555555"');
  });
});
