import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Buyer-safe related topics for platform-health help (TB-1612). */
export const ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS: readonly EvidenceAdminSourceLink[] = [
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;

/** Admin-only eng runbooks — omitted from Related for non-admin callers (TB-1612 / TB-1246). */
export const ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS: readonly EvidenceAdminSourceLink[] = [
  {
    label: "Engineering troubleshooting runbook",
    href: inAppHelpHref("engineering-troubleshooting"),
    adminOnly: true,
  },
  { label: "CLI usage", href: inAppHelpHref("cli-usage"), adminOnly: true },
] as const;

export const ADMIN_DIAGNOSTICS_HELP_BANNED_PUBLIC_RELATED_HELP_SLUGS: readonly string[] = [
  "engineering-troubleshooting",
  "developer-troubleshooting",
  "cli-usage",
] as const;

export function listAdminDiagnosticsHelpRelatedTopics(isAdmin: boolean): readonly EvidenceAdminSourceLink[] {
  if (!isAdmin) {
    return ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS;
  }

  return [...ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS, ...ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS];
}

export function relatedTopicsContainBannedPublicHelpSlug(
  topics: readonly EvidenceAdminSourceLink[],
): boolean {
  return topics.some((topic) =>
    ADMIN_DIAGNOSTICS_HELP_BANNED_PUBLIC_RELATED_HELP_SLUGS.some((slug) => topic.href.includes(slug)),
  );
}
