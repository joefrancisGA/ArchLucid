import {
  tryLoadFoldedInternalRunbook,
  tryLoadProductDocumentation,
  type LoadedProductDocumentation,
} from "@/lib/load-product-documentation";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/** TB-2238 — how a help topic body is resolved before render. */
export type HelpTopicContentKind =
  | "repo-markdown"
  | "app-guided"
  | "markdown-with-layout"
  | "internal-runbook-client-fetch";

/**
 * Slugs rendered by dedicated `Help*GuideView` modules instead of raw markdown.
 * New app-guided topics must register here and in `help-topic-view-resolver.tsx`.
 */
export const HELP_APP_GUIDED_TOPIC_SLUGS = [
  "first-architecture-review",
  "getting-started",
  "cloud-connections",
  "troubleshooting",
  "alerts",
  "digests",
  "decision-register",
  "improvement-planning",
  "impact-preview",
  "advisory-scans",
  "recurrence-schedules",
  "roi-summary",
  "architecture-scorecard",
  "connection-status",
  "standards-and-rules",
  "baseline-settings",
  "slack-integration",
  "teams-integration",
  "webhooks-integration",
  "api-keys",
  "system-health",
  "ai-usage",
  "preferences",
  "notifications",
  "workspace-settings",
  "evidence-graph",
  "search-review-evidence",
  "architecture-intelligence",
  "sponsor-dashboard",
  "architecture-drafts",
  "model-governance",
  "jira-integration",
  "servicenow-integration",
  "billing-and-plans",
  "sponsor-report",
  "findings",
  "governance-approval",
  "cli-usage",
  "glossary",
  "users-and-roles",
  "cloud-connections-azure",
  "cloud-connections-aws",
  "cloud-connections-gcp",
  "azure-permissions",
  "specialty-walkthroughs",
  "repeat-review-loop",
  "audit-trail",
  "review-packages",
  "review-guide",
  "pilot-guide",
  "data-handling",
  "dpa-template",
  "soc2-self-assessment",
  "configuration-reference",
  "enterprise-onboarding",
  "evidence-intake",
  "engineering-troubleshooting",
  "api-contracts",
  "accelerator-chooser",
  "admin-diagnostics",
  "authentication-sign-in",
  "azure-boards",
  "policy-packs",
  "policy-pack-delta-demo",
  "prior-manifest-retrieval",
  "report-a-problem",
  "integration-readiness",
  "pilot-feedback",
  "caiq-sig-response",
  "choose-your-next-step",
  "comparison-replay",
  "contact-support",
  "procurement",
  "evidence-trail",
] as const;

/** Buyer topics rendered through `HelpTopicMarkdownView` with evidence/layout strips. */
export const HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS = [
  "security-trust",
  "subprocessors",
  "scope",
] as const;

const HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUG_SET = new Set<string>(
  HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS,
);

const HELP_APP_GUIDED_TOPIC_SLUG_SET = new Set<string>(HELP_APP_GUIDED_TOPIC_SLUGS);

export type LoadedHelpTopicContent = LoadedProductDocumentation & {
  readonly contentKind: HelpTopicContentKind;
};

export function resolveHelpTopicContentKind(
  entry: ProductDocumentationEntry,
): HelpTopicContentKind {
  if (entry.contentKind === "internal-runbook") {
    return "internal-runbook-client-fetch";
  }

  if (HELP_APP_GUIDED_TOPIC_SLUG_SET.has(entry.slug)) {
    return "app-guided";
  }

  if (HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUG_SET.has(entry.slug)) {
    return "markdown-with-layout";
  }

  return "repo-markdown";
}

/** Unified loader for in-app help topics (markdown + app-guided metadata). */
export function loadHelpTopicContent(slug: string): LoadedHelpTopicContent | null {
  const loaded = tryLoadProductDocumentation(slug);

  if (loaded === null) {
    return null;
  }

  return {
    ...loaded,
    contentKind: resolveHelpTopicContentKind(loaded.entry),
  };
}

/** Loads folded internal runbook markdown for admin-only help sections. */
export function loadFoldedInternalRunbookContent(slug: string): LoadedProductDocumentation | null {
  return tryLoadFoldedInternalRunbook(slug);
}

export function isHelpAppGuidedTopicSlug(slug: string): boolean {
  return HELP_APP_GUIDED_TOPIC_SLUG_SET.has(slug);
}
