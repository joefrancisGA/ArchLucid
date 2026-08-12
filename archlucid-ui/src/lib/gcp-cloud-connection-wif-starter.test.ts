import { describe, expect, it } from "vitest";

import { GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER } from "@/app/(operator)/integrations/cloud-connections/_sections/gcp-connection-wizard-content";
import { GCP_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/gcp-cloud-connection-copy";
import {
  buildGcpWifStarterFederationIdentifiers,
  buildGcpWorkloadIdentityPoolProviderSetupScript,
  formatGcpWorkloadIdentityPoolProviderResourceName,
  GCP_WIF_POOL_ID,
  GCP_WIF_PROVIDER_ID,
  GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
} from "@/lib/gcp-cloud-connection-wif-starter";

describe("gcp-cloud-connection-wif-starter", () => {
  it("formats the provider resource name operators paste into ArchLucid", () => {
    expect(
      formatGcpWorkloadIdentityPoolProviderResourceName("my-project", GCP_WIF_POOL_ID, GCP_WIF_PROVIDER_ID),
    ).toBe(
      "projects/my-project/locations/global/workloadIdentityPools/archlucid-pool/providers/archlucid-azure-ad",
    );
  });

  it("builds a gcloud starter with federation issuer, audience, and replace targets (TB-1775)", () => {
    const script = buildGcpWorkloadIdentityPoolProviderSetupScript("11111111-2222-3333-4444-555555555555");

    expect(script).toContain('PROJECT_ID="11111111-2222-3333-4444-555555555555"');
    expect(script).toContain(`POOL_ID="${GCP_WIF_POOL_ID}"`);
    expect(script).toContain(`PROVIDER_ID="${GCP_WIF_PROVIDER_ID}"`);
    expect(script).toContain('ARCHLUCID_TENANT_ID="YOUR_ARCHLUCID_TENANT_ID"');
    expect(script).toContain('ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID"');
    expect(script).toContain("workload-identity-pools providers create-oidc");
    expect(script).toContain("api://AzureADTokenExchange");
    expect(script).toContain("login.microsoftonline.com");
    expect(script).toContain("workloadIdentityPools");
    expect(script).toContain("roles/cloudasset.viewer");
    expect(GCP_WIF_STARTER_SCRIPT_REPLACE_HINT).toContain("pre-filled");
    expect(GCP_WIF_STARTER_SCRIPT_REPLACE_HINT).toContain("PROJECT_ID");
  });

  it("publishes issuer and audience federation identifiers", () => {
    const identifiers = buildGcpWifStarterFederationIdentifiers({
      tenantId: "11111111-2222-3333-4444-555555555555",
      managedIdentityObjectId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });
    const issuer = identifiers.find((row) => row.id === "issuer");
    const audience = identifiers.find((row) => row.id === "audience");

    expect(issuer?.value).toContain("login.microsoftonline.com/11111111-2222-3333-4444-555555555555");
    expect(audience?.value).toBe("api://AzureADTokenExchange");
  });

  it("aligns wizard placeholder, federation table example, and script pool/provider IDs (P0-5)", () => {
    const providerExample = buildGcpWifStarterFederationIdentifiers({
      tenantId: "",
      managedIdentityObjectId: "",
    }).find((row) => row.id === "provider-resource")?.value;
    const script = buildGcpWorkloadIdentityPoolProviderSetupScript();

    expect(GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER).toBe(providerExample);
    expect(script).toContain(`POOL_ID="${GCP_WIF_POOL_ID}"`);
    expect(script).toContain(`PROVIDER_ID="${GCP_WIF_PROVIDER_ID}"`);
    expect(GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER).toContain(GCP_WIF_POOL_ID);
    expect(GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER).toContain(GCP_WIF_PROVIDER_ID);
  });

  it("keeps WIF starter copy free of Tier/hosted-poll jargon (TB-1774)", () => {
    const surfaces = [
      buildGcpWorkloadIdentityPoolProviderSetupScript(),
      GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
      ...buildGcpWifStarterFederationIdentifiers({ tenantId: "", managedIdentityObjectId: "" }).map(
        (row) => row.value,
      ),
    ];

    for (const surface of surfaces) {
      for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
