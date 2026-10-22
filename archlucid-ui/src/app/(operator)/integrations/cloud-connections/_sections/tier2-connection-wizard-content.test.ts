import { afterEach, describe, expect, it, vi } from "vitest";



import {
  buildTier2AzureSetupScript,
  tier2AzureFederationIdentifiers,
  TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT,
} from "./tier2-connection-wizard-content";

import { AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE } from "@/lib/azure-cloud-connection-copy";



const TENANT_ID = "11111111-1111-1111-1111-111111111111";

const MANAGED_IDENTITY_ID = "22222222-2222-2222-2222-222222222222";



describe("buildTier2AzureSetupScript", () => {

  it("interpolates ArchLucid federation identifiers and leaves only SUBSCRIPTION_ID as placeholder", () => {

    const script = buildTier2AzureSetupScript({

      archlucidTenantId: TENANT_ID,

      archlucidManagedIdentityObjectId: MANAGED_IDENTITY_ID,

    });



    expect(script.indexOf("SUBSCRIPTION_ID=")).toBeLessThan(script.indexOf("az ad sp create-for-rbac"));

    expect(script).toContain("# Azure read-only extractor — customer tenant setup (Azure CLI)");

    expect(script).not.toMatch(/Tier\s*2/i);

    expect(script).toContain('SUBSCRIPTION_ID="YOUR_SUBSCRIPTION_ID"');

    expect(script).toContain(`ARCHLUCID_TENANT_ID="${TENANT_ID}"`);

    expect(script).toContain(`ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="${MANAGED_IDENTITY_ID}"`);

    expect(script).not.toContain("YOUR_ARCHLUCID_TENANT_ID");

    expect(script).not.toContain("YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID");

    expect(script).toContain("${ARCHLUCID_TENANT_ID}");

    expect(script).toContain("${ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID}");

    expect(script).toContain("Optional — Cost Management Reader");

    expect(script).toContain(AZURE_CONNECTION_SETUP_SCRIPT_VALIDATION_NOTE);

    expect(script).toMatch(/# az role assignment create .*Cost Management Reader/);

    expect(TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT).toContain("SUBSCRIPTION_ID");

    expect(TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT).not.toContain("YOUR_ARCHLUCID_TENANT_ID");

  });



  it("accepts a concrete subscription id for the SUBSCRIPTION_ID assignment", () => {

    const script = buildTier2AzureSetupScript({

      subscriptionIdPlaceholder: "11111111-2222-3333-4444-555555555555",

      archlucidTenantId: TENANT_ID,

      archlucidManagedIdentityObjectId: MANAGED_IDENTITY_ID,

    });



    expect(script).toContain('SUBSCRIPTION_ID="11111111-2222-3333-4444-555555555555"');

  });

  it("labels federation identifiers SecureNow in the Security shell", () => {
    const identifiers = tier2AzureFederationIdentifiers(
      {
        tenantId: TENANT_ID,
        managedIdentityObjectId: MANAGED_IDENTITY_ID,
      },
      "security",
    );

    expect(identifiers[0]?.label).toBe("SecureNow tenant ID");
    expect(identifiers[1]?.label).toBe("SecureNow managed identity object ID");
  });
});


