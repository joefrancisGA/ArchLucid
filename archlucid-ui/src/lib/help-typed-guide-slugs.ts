/**
 * Help topics rendered by dedicated React views (not HelpTopicMarkdownView).
 * These must still resolve when source markdown is absent from the UI container image.
 */

const TYPED_HELP_GUIDE_SLUGS = new Set<string>([
  "first-architecture-review",
  "getting-started",
  "troubleshooting",
  "alerts",
  "billing-and-plans",
  "executive-summary",
  "findings",
  "governance-approval",
  "glossary",
  "users-and-roles",
  "cloud-connections-azure",
  "azure-permissions",
  "specialty-walkthroughs",
]);

/** True when `/help/{slug}` uses a typed guide view that does not require filesystem markdown. */
export function isTypedHelpGuideSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();

  return TYPED_HELP_GUIDE_SLUGS.has(normalized);
}
