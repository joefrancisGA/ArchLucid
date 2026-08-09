import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export function formatHelpTopicApplicabilityMetadata(entry: ProductDocumentationEntry): string | null {
  const parts: string[] = [];

  if (entry.lastReviewed !== undefined) {
    parts.push(`Last reviewed ${entry.lastReviewed}`);
  }

  if (entry.releaseApplicability !== undefined) {
    parts.push(entry.releaseApplicability);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}
