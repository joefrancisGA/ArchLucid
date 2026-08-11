import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS = new Set(["report-a-problem", "repeat-review-loop"]);

/** Buyer help chrome omits registry review dates except for explicit provenance topics. */
export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
  options?: { readonly reviewedLabel?: string },
): string | null {
  if (!HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS.has(entry.slug)) {
    return null;
  }

  const reviewed = entry.lastReviewed?.trim() ?? "";
  const applicability = entry.releaseApplicability?.trim() ?? "";

  if (reviewed.length === 0 && applicability.length === 0) {
    return null;
  }

  const reviewedLabel = options?.reviewedLabel?.trim() || "Last reviewed";
  const parts: string[] = [];

  if (reviewed.length > 0) {
    parts.push(`${reviewedLabel} ${reviewed}`);
  }

  if (applicability.length > 0) {
    parts.push(applicability);
  }

  return parts.join(" · ");
}
