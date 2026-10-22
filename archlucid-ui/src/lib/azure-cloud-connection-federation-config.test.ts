import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isAzureHostedFederationConfigComplete,
  readAzureHostedFederationConfig,
} from "@/lib/azure-cloud-connection-federation-config";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const MANAGED_IDENTITY_ID = "22222222-2222-2222-2222-222222222222";

describe("readAzureHostedFederationConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads hosted identity values from NEXT_PUBLIC env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", TENANT_ID);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", MANAGED_IDENTITY_ID);

    expect(readAzureHostedFederationConfig()).toEqual({
      tenantId: TENANT_ID,
      managedIdentityObjectId: MANAGED_IDENTITY_ID,
    });
    expect(isAzureHostedFederationConfigComplete(readAzureHostedFederationConfig())).toBe(true);
  });

  it("returns empty strings when env vars are unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", "");

    const config = readAzureHostedFederationConfig();

    expect(config.tenantId).toBe("");
    expect(config.managedIdentityObjectId).toBe("");
    expect(isAzureHostedFederationConfigComplete(config)).toBe(false);
  });
});
