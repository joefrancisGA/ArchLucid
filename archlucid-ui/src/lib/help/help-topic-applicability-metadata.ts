import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS = new Set(["report-a-problem"]);

export const HELP_TOPIC_GUIDE_REVIEW_PROVENANCE_SLUGS = new Set([
  "architecture-drafts",
  "architecture-intelligence",
  "architecture-scorecard",
  "advisory-scans",
  "ai-usage",
  "baseline-settings",
  "connection-status",
  "contact-support",
  "decision-register",
  "evidence-graph",
  "impact-preview",
  "improvement-planning",
  "jira-integration",
  "servicenow-integration",
  "slack-integration",
  "teams-integration",
  "webhooks-integration",
  "standards-and-rules",
  "model-governance",
  "notifications",
  "preferences",
  "recurrence-schedules",
  "roi-summary",
  "search-review-evidence",
  "sponsor-dashboard",
  "system-health",
  "workspace-settings",
  "cloud-connections-aws",
  "cloud-connections-azure",
  "cloud-connections-gcp",
  "comparison-replay",
]);

/** Registry taxonomy tokens (e.g. `integrations servicenow orientation`) are not buyer-facing prose. */
export function isRawInternalGuideReviewApplicability(applicability: string): boolean {
  const trimmed = applicability.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (/[A-Z]/.test(trimmed)) {
    return false;
  }

  return /\borientation\b/.test(trimmed);
}

function formatGuideReviewProvenance(entry: ProductDocumentationEntry): string | null {
  const lastReviewed = entry.lastReviewed?.trim() ?? "";
  const applicabilityRaw = entry.releaseApplicability?.trim() ?? "";
  const applicability =
    applicabilityRaw.length > 0 && isRawInternalGuideReviewApplicability(applicabilityRaw)
      ? ""
      : applicabilityRaw;

  if (lastReviewed.length === 0 && applicability.length === 0) {
    return null;
  }

  if (lastReviewed.length > 0 && applicability.length > 0) {
    return `Guide last reviewed ${lastReviewed} · ${applicability}`;
  }

  if (lastReviewed.length > 0) {
    return `Guide last reviewed ${lastReviewed}`;
  }

  return applicability;
}

/** Buyer help chrome shows applicability for explicit provenance topics and never registry review dates. */
export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
): string | null {
  if (HELP_TOPIC_GUIDE_REVIEW_PROVENANCE_SLUGS.has(entry.slug)) {
    return formatGuideReviewProvenance(entry);
  }

  if (!HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS.has(entry.slug)) {
    return null;
  }

  const applicability = entry.releaseApplicability?.trim() ?? "";

  if (applicability.length === 0) {
    return null;
  }

  return applicability;
}
