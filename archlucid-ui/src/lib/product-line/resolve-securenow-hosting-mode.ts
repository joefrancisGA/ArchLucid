export const SECURENOW_HOSTING_ENV_NAME = "NEXT_PUBLIC_SECURENOW_HOSTING";

export type SecureNowHostingMode = "ArchLucidHosted" | "InTenant";

/** Deployment configuration is authoritative; browser state cannot change hosting mode. */
export function resolveSecureNowHostingModeFromEnv(): SecureNowHostingMode {
  const raw = (process.env[SECURENOW_HOSTING_ENV_NAME] ?? "").trim();

  return raw === "InTenant" ? "InTenant" : "ArchLucidHosted";
}

export function isSecureNowInTenantFromEnv(): boolean {
  return resolveSecureNowHostingModeFromEnv() === "InTenant";
}
