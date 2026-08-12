import { isAzureGuid } from "@/lib/azure-identifier-validation";

export type AzureHostedFederationConfig = {
  readonly tenantId: string;
  readonly managedIdentityObjectId: string;
};

function readTrimmedEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * ArchLucid-hosted identity values published per environment for customer federated trust setup.
 * Set `NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID` and
 * `NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID` on the UI build.
 */
export function readAzureHostedFederationConfig(): AzureHostedFederationConfig {
  const tenantId = readTrimmedEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID");
  const managedIdentityObjectId = readTrimmedEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID");

  return {
    tenantId,
    managedIdentityObjectId,
  };
}

export function isAzureHostedFederationConfigComplete(config: AzureHostedFederationConfig): boolean {
  return isAzureGuid(config.tenantId) && isAzureGuid(config.managedIdentityObjectId);
}
