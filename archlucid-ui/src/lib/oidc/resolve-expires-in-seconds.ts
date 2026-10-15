import { normalizeOidcConfigurationString } from "@/lib/oidc/oauth-callback-messages";

/** Normalizes OIDC `expires_in` (seconds) for client hints and BFF cookie TTL parity. */
export function resolveExpiresInSeconds(expiresIn: number | undefined): number {
  const defaultExpiresInSec = 3600;

  if (expiresIn === undefined) {
    return defaultExpiresInSec;
  }

  // Malformed JSON scalars such as null/boolean are coerced by Number() to
  // zero/one; treat them as absent instead of creating a misleading short TTL.
  if (expiresIn === null || typeof expiresIn === "boolean") {
    return defaultExpiresInSec;
  }

  let numericExpiresIn: number;

  if (typeof expiresIn === "string") {
    const normalized = normalizeOidcConfigurationString(expiresIn);

    if (normalized.length === 0) {
      return defaultExpiresInSec;
    }

    numericExpiresIn = Number(normalized);
  } else {
    numericExpiresIn = Number(expiresIn);
  }

  if (!Number.isFinite(numericExpiresIn)) {
    return defaultExpiresInSec;
  }

  const truncatedExpiresIn = Math.trunc(numericExpiresIn);

  if (truncatedExpiresIn === 0) {
    return 0;
  }

  if (truncatedExpiresIn < 0) {
    return defaultExpiresInSec;
  }

  // JSON numbers above 2^53-1 are not safe integers; do not write misleading century-long TTL hints.
  if (!Number.isSafeInteger(truncatedExpiresIn)) {
    return defaultExpiresInSec;
  }

  return truncatedExpiresIn;
}
