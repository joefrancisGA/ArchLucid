import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
  options?: { readonly reviewedLabel?: string },
): string | null {
  const parts: string[] = [];
  const reviewedLabel = options?.reviewedLabel ?? "Last reviewed";

  if (entry.lastReviewed !== undefined) {
    parts.push(`${reviewedLabel} ${entry.lastReviewed}`);
  }

  if (entry.releaseApplicability !== undefined) {
    parts.push(entry.releaseApplicability);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}
