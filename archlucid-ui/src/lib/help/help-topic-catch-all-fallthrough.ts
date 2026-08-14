import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/** Dedicated specialty guide views in `help/[...topic]/page.tsx` (TB-1601). */
export const HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS = [
  "accelerator-chooser",
  "admin-diagnostics",
  "alerts",
  "api-contracts",
  "architecture-scorecard",
  "audit-trail",
  "azure-boards",
  "azure-permissions",
  "billing-and-plans",
  "choose-your-next-step",
  "cli-usage",
  "cloud-connections",
  "cloud-connections-aws",
  "cloud-connections-azure",
  "cloud-connections-gcp",
  "comparison-replay",
  "configuration-reference",
  "connection-status",
  "data-handling",
  "digests",
  "dpa-template",
  "engineering-troubleshooting",
  "enterprise-onboarding",
  "evidence-intake",
  "evidence-trail",
  "executive-summary",
  "findings",
  "first-architecture-review",
  "getting-started",
  "glossary",
  "governance-approval",
  "pilot-feedback",
  "pilot-guide",
  "pilot-outcomes",
  "policy-pack-delta-demo",
  "policy-packs",
  "procurement",
  "repeat-review-loop",
  "recurrence-schedules",
  "review-guide",
  "review-packages",
  "roi-summary",
  "soc2-self-assessment",
  "specialty-walkthroughs",
  "standards-and-rules",
  "troubleshooting",
  "users-and-roles",
] as const;

/** Explicit enriched `HelpTopicMarkdownView` branches — not bare Print/PDF fallthrough (TB-1601). */
export const HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS = [
  "authentication-sign-in",
  "caiq-sig-response",
  "integration-readiness",
  "prior-manifest-retrieval",
  "report-a-problem",
  "scope",
  "security-trust",
  "subprocessors",
] as const;

export type HelpTopicBareMarkdownFallthroughAllowlistEntry = {
  slug: string;
  backlogId: string;
};

/** Residual bare markdown exceptions — each row must cite an open specialty backlog owner (TB-1601). */
export const HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST: ReadonlyArray<HelpTopicBareMarkdownFallthroughAllowlistEntry> =
  [];

export type HelpTopicCatchAllDispatchKind =
  | "specialty-guide"
  | "enriched-markdown"
  | "bare-markdown-allowlisted";

export function resolveHelpTopicCatchAllDispatchKind(
  entry: Pick<ProductDocumentationEntry, "slug" | "contentKind">,
): HelpTopicCatchAllDispatchKind | null {
  const slug = entry.slug;

  if ((HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS as readonly string[]).includes(slug)) {
    return "specialty-guide";
  }

  if ((HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS as readonly string[]).includes(slug)) {
    return "enriched-markdown";
  }

  if (HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST.some((item) => item.slug === slug)) {
    return "bare-markdown-allowlisted";
  }

  return null;
}

/** Fail closed when a buyer/product slug would silently hit bare markdown fallthrough (TB-1601). */
export function assertHelpTopicCatchAllFallthroughAllowed(
  entry: Pick<ProductDocumentationEntry, "slug" | "contentKind">,
): void {
  if (entry.contentKind === "internal-runbook") {
    return;
  }

  const kind = resolveHelpTopicCatchAllDispatchKind(entry);

  if (kind === "bare-markdown-allowlisted") {
    return;
  }

  throw new Error(
    `Help topic "${entry.slug}" (${entry.contentKind}) reached bare HelpTopicMarkdownView fallthrough without an explicit TB-1601 allowlist entry.`,
  );
}
