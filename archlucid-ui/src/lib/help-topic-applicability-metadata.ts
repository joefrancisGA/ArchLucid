import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/**
 * Buyer help chrome omits registry review dates by default.
 * Report-a-problem is an exception — support/diagnostic claims need dated provenance.
 */
export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
  options?: { readonly reviewedLabel?: string },
): string | null {
  if (entry.slug !== "report-a-problem") {
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
