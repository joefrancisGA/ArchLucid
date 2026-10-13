import {
  DEFAULT_SECURENOW_EDITION_ID,
  isSecureNowEditionId,
  type SecureNowEditionId,
} from "@/lib/editions/securenow-edition-id";

/** Deployment edition for this Next.js process. Not a cookie, header, or query string. */
export const SECURENOW_EDITION_ENV_NAME = "NEXT_PUBLIC_SECURENOW_EDITION";

/**
 * Reads `NEXT_PUBLIC_SECURENOW_EDITION`. Missing or unknown values stay generic.
 * Callers pass `raw` in tests; otherwise the process env is used.
 */
export function resolveSecureNowEditionId(
  raw: string | null | undefined = process.env.NEXT_PUBLIC_SECURENOW_EDITION,
): SecureNowEditionId {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (isSecureNowEditionId(normalized)) {
    return normalized;
  }

  return DEFAULT_SECURENOW_EDITION_ID;
}
