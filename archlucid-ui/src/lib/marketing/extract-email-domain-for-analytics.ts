/**
 * Domain segment of an email for analytics (lowercase). No hashing — spec allows domain-only.
 */
export function extractEmailDomainForAnalytics(email: string): string | undefined {
  const trimmed: string = email.trim();
  const at: number = trimmed.lastIndexOf("@");

  if (at < 1 || at === trimmed.length - 1) return undefined;

  const domain: string = trimmed.slice(at + 1).toLowerCase().trim();

  return domain.length > 0 ? domain : undefined;
}
