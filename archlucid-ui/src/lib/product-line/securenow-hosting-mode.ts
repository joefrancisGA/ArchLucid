export const SECURENOW_HOSTING_MODE_ENV_NAME = "NEXT_PUBLIC_SECURENOW_HOSTING";

export const SECURENOW_HOSTING_MODES = ["archlucid-hosted", "in-tenant"] as const;

export type SecureNowHostingMode = (typeof SECURENOW_HOSTING_MODES)[number];

export const DEFAULT_SECURENOW_HOSTING_MODE: SecureNowHostingMode = "archlucid-hosted";

export function resolveSecureNowHostingMode(
  raw: string | null | undefined = process.env.NEXT_PUBLIC_SECURENOW_HOSTING,
): SecureNowHostingMode {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (normalized === "in-tenant" || normalized === "intenant") {
    return "in-tenant";
  }

  return DEFAULT_SECURENOW_HOSTING_MODE;
}

export function isSecureNowInTenantHosting(
  raw: string | null | undefined = process.env.NEXT_PUBLIC_SECURENOW_HOSTING,
): boolean {
  return resolveSecureNowHostingMode(raw) === "in-tenant";
}
