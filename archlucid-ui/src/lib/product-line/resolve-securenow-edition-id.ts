import {
  DEFAULT_SECURENOW_EDITION_ID,
  isSecureNowEditionId,
  type SecureNowEditionId,
} from "@/lib/product-line/securenow-edition-id";

export const SECURENOW_EDITION_ENV_NAME = "NEXT_PUBLIC_SECURENOW_EDITION";

/** Deployment configuration is authoritative; browser state cannot change an edition. */
export function resolveSecureNowEditionIdFromEnv(): SecureNowEditionId {
  const raw = (process.env[SECURENOW_EDITION_ENV_NAME] ?? "").trim().toLowerCase();

  if (isSecureNowEditionId(raw)) {
    return raw;
  }

  return DEFAULT_SECURENOW_EDITION_ID;
}

export function isSecureNowUhgEdition(): boolean {
  return resolveSecureNowEditionIdFromEnv() === "uhg";
}
