import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS = new Set(["report-a-problem"]);

const HELP_TOPIC_GUIDE_REVIEW_PROVENANCE_SLUGS = new Set([
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
  "model-governance",
  "notifications",
  "preferences",
  "recurrence-schedules",
]);

function formatGuideReviewProvenance(entry: ProductDocumentationEntry): string | null {
  const lastReviewed = entry.lastReviewed?.trim() ?? "";
  const applicability = entry.releaseApplicability?.trim() ?? "";

  if (lastReviewed.length === 0 && applicability.length === 0) {
    return null;
  }

  if (lastReviewed.length > 0 && applicability.length > 0) {
    return `Last reviewed ${lastReviewed} · ${applicability}`;
  }

  if (lastReviewed.length > 0) {
    return `Last reviewed ${lastReviewed}`;
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
