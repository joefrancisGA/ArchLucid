/** Default lead time (days) before SP signing certificate expiry for operator-visible warnings — configurable later via hosting settings if needed. */
export const SAML_SP_SIGNING_CERT_WARNING_DAYS = 30;

export type SamlSigningCertExpiryBannerDecision =
  | { showBanner: false }
  | { showBanner: true; variant: "expired" | "expiring"; expiresAtUtcMs: number };

const MS_PER_DAY = 86_400_000;

/**
 * Determines whether operators should see an expiry banner for the SAML SP signing certificate (surfacing-only UI).
 *
 * @param notAfterIsoUtc — ISO-8601 instant from `spSigningCertificateNotAfterUtc`.
 */
export function evaluateSamlSigningCertExpiryBanner(options: {
  notAfterIsoUtc: string | null | undefined;
  nowMs: number;
  warningLeadDays: number;
}): SamlSigningCertExpiryBannerDecision {
  const trimmed = options.notAfterIsoUtc?.trim();

  if (!trimmed) {
    return { showBanner: false };
  }

  const expiryMs = Date.parse(trimmed);

  if (Number.isNaN(expiryMs)) {
    return { showBanner: false };
  }

  const leadMs = options.warningLeadDays * MS_PER_DAY;

  if (options.nowMs >= expiryMs) {
    return { showBanner: true, variant: "expired", expiresAtUtcMs: expiryMs };
  }

  const msRemaining = expiryMs - options.nowMs;

  if (msRemaining <= leadMs) {
    return { showBanner: true, variant: "expiring", expiresAtUtcMs: expiryMs };
  }

  return { showBanner: false };
}
