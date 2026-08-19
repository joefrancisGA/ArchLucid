/**
 * Self-service abuse policy caps trials per email *domain* (default 5 / 24h).
 * Live E2E must not share `example.com` across many registrations in one CI SQL DB.
 */
export function uniqueTrialWorkEmail(localPrefix: string, suffix: string): string {
  const safeLocal = localPrefix.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const safeSuffix = suffix.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  return `${safeLocal}@${safeSuffix}.e2e.archlucid.test`;
}
