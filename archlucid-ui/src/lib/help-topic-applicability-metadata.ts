import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

function formatReleaseApplicabilityPhrase(entry: ProductDocumentationEntry): string | null {
  if (entry.releaseApplicability === undefined) {
    return null;
  }

  if (entry.releaseApplicability.startsWith("Applies to")) {
    return entry.releaseApplicability;
  }

  return `Applies to V1 GA — ${entry.releaseApplicability}`;
}

export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
  options?: { readonly reviewedLabel?: string },
): string | null {
  const parts: string[] = [];
  const reviewedLabel = options?.reviewedLabel ?? "Last reviewed";

  if (entry.lastReviewed !== undefined) {
    parts.push(`${reviewedLabel} ${entry.lastReviewed}`);
  }

  const releaseApplicability = formatReleaseApplicabilityPhrase(entry);

  if (releaseApplicability !== null) {
    parts.push(releaseApplicability);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}
