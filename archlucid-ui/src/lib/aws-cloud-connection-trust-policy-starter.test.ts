import { describe, expect, it } from "vitest";

import { AWS_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/aws-cloud-connection-copy";
import {
  AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS,
  AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT,
  buildAwsTrustStarterPolicyTemplate,
} from "@/lib/aws-cloud-connection-trust-policy-starter";

describe("aws-cloud-connection-trust-policy-starter", () => {
  it("builds AssumeRoleWithWebIdentity trust policy with federation placeholders (TB-1765)", () => {
    const template = buildAwsTrustStarterPolicyTemplate();

    expect(template).toContain("sts:AssumeRoleWithWebIdentity");
    expect(template).toContain("api://AzureADTokenExchange");
    expect(template).toContain("sts.windows.net/{ArchLucid tenant ID}");
    expect(template).toContain("{ArchLucid managed identity object ID}");
    expect(AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT).toContain("ArchLucid tenant ID");
  });

  it("publishes issuer and audience federation identifiers", () => {
    const issuer = AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS.find((row) => row.id === "issuer");
    const audience = AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS.find((row) => row.id === "audience");

    expect(issuer?.value).toContain("login.microsoftonline.com");
    expect(audience?.value).toBe("api://AzureADTokenExchange");
  });

  it("keeps trust-policy starter copy free of Tier/hosted-poll jargon (TB-1763)", () => {
    const surfaces = [
      buildAwsTrustStarterPolicyTemplate(),
      AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT,
      ...AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS.flatMap((row) => [row.value, row.hint]),
    ];

    for (const surface of surfaces) {
      for (const banned of AWS_CLOUD_CONNECTION_BANNED_COPY) {
        expect(surface.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });
});
