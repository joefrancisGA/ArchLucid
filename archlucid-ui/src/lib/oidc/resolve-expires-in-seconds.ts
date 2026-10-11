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

  const numericExpiresIn = Number(expiresIn);

  if (!Number.isFinite(numericExpiresIn)) {
    return defaultExpiresInSec;
  }

  if (numericExpiresIn === 0) {
    return 0;
  }

  if (numericExpiresIn < 0) {
    return defaultExpiresInSec;
  }

  return Math.trunc(numericExpiresIn);
}
