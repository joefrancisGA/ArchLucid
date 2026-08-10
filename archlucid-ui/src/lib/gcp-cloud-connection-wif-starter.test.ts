import { describe, expect, it } from "vitest";

import { GCP_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/gcp-cloud-connection-copy";
import {
  buildGcpWorkloadIdentityPoolProviderSetupScript,
  formatGcpWorkloadIdentityPoolProviderResourceName,
  GCP_WIF_STARTER_FEDERATION_IDENTIFIERS,
  GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
} from "@/lib/gcp-cloud-connection-wif-starter";

describe("gcp-cloud-connection-wif-starter", () => {
  it("formats the provider resource name operators paste into ArchLucid", () => {
    expect(
      formatGcpWorkloadIdentityPoolProviderResourceName("my-project", "archlucid-pool", "archlucid-azure-ad"),
    ).toBe("projects/my-project/locations/global/workloadIdentityPools/archlucid-pool/providers/archlucid-azure-ad");
  });

  it("builds a gcloud starter with federation issuer, audience, and replace targets (TB-1775)", () => {
    const script = buildGcpWorkloadIdentityPoolProviderSetupScript("11111111-2222-3333-4444-555555555555");

    expect(script).toContain('PROJECT_ID="11111111-2222-3333-4444-555555555555"');
    expect(script).toContain('ARCHLUCID_TENANT_ID="YOUR_ARCHLUCID_TENANT_ID"');
    expect(script).toContain('ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID="YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID"');
    expect(script).toContain("workload-identity-pools providers create-oidc");
    expect(script).toContain("api://AzureADTokenExchange");
    expect(script).toContain("login.microsoftonline.com");
    expect(script).toContain("workloadIdentityPools");
    expect(script).toContain("roles/cloudasset.viewer");
    expect(GCP_WIF_STARTER_SCRIPT_REPLACE_HINT).toContain("ARCHLUCID_TENANT_ID");
  });

  it("publishes issuer and audience federation identifiers", () => {
    const issuer = GCP_WIF_STARTER_FEDERATION_IDENTIFIERS.find((row) => row.id === "issuer");
    const audience = GCP_WIF_STARTER_FEDERATION_IDENTIFIERS.find((row) => row.id === "audience");

    expect(issuer?.value).toContain("login.microsoftonline.com");
    expect(audience?.value).toBe("api://AzureADTokenExchange");
  });

  it("keeps WIF starter copy free of Tier/hosted-poll jargon (TB-1774)", () => {
    const surfaces = [
      buildGcpWorkloadIdentityPoolProviderSetupScript(),
      GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
      ...GCP_WIF_STARTER_FEDERATION_IDENTIFIERS.map((row) => row.value),
    ];

    for (const surface of surfaces) {
      for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
