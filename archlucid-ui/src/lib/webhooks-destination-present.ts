/** Returns a customer-safe destination label (hostname, not full URL with sensitive path/query). */
export function formatWebhookDestinationLabel(destination: string): string {
  const trimmed = destination.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname;
    const hasSensitivePath = parsed.pathname.length > 1 || parsed.search.length > 0;

    if (!hasSensitivePath) {
      return hostname;
    }

    return `${hostname}/…`;
  } catch {
    return "Configured endpoint";
  }
}
