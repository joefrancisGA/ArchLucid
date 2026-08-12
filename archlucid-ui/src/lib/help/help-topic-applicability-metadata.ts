import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS = new Set(["report-a-problem"]);

/** Buyer help chrome shows applicability for explicit provenance topics and never registry review dates. */
export function formatHelpTopicApplicabilityMetadata(
  entry: ProductDocumentationEntry,
): string | null {
  if (!HELP_TOPIC_REGISTRY_PROVENANCE_SLUGS.has(entry.slug)) {
    return null;
  }

  const applicability = entry.releaseApplicability?.trim() ?? "";

  if (applicability.length === 0) {
    return null;
  }

  return applicability;
}
