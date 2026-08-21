/** True when href stays inside the in-app Help Center (`/help/...`). */
export function isInAppHelpFollowUpHref(href: string): boolean {
  const normalized = href.trim();

  return normalized === "/help" || normalized.startsWith("/help/");
}

/**
 * Prefixes help follow-up link text so readers can tell Help vs product destinations before click.
 * Help links read "Read …"; product routes read "Open …".
 * Strips titled "Related Guides" omit prefixes — the heading already implies help topics.
 */
export function formatHelpFollowUpLinkAccessibleName(href: string, label: string): string {
  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    return trimmedLabel;
  }

  if (trimmedLabel.startsWith("Read ") || trimmedLabel.startsWith("Open ")) {
    return trimmedLabel;
  }

  if (isInAppHelpFollowUpHref(href)) {
    return `Read ${trimmedLabel}`;
  }

  return `Open ${trimmedLabel}`;
}
