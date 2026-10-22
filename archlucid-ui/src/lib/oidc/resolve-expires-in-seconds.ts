import {
  MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC,
  normalizeNumericOidcHintString,
} from "@/lib/oidc/oauth-callback-messages";

export { MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC };

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

  // Malformed JSON such as `expires_in: []` must not coerce via `Number([]) === 0`.
  if (typeof expiresIn === "object") {
    return defaultExpiresInSec;
  }

  let numericExpiresIn: number;

  if (typeof expiresIn === "string") {
    const normalized = normalizeNumericOidcHintString(expiresIn);

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

  if (truncatedExpiresIn > MAX_PLAUSIBLE_OIDC_EXPIRES_IN_SEC) {
    return defaultExpiresInSec;
  }

  return truncatedExpiresIn;
}
