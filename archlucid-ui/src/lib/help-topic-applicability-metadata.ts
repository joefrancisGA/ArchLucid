import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/** Buyer help chrome omits registry review dates and release applicability labels. */
export function formatHelpTopicApplicabilityMetadata(
  _entry: ProductDocumentationEntry,
  _options?: { readonly reviewedLabel?: string },
): string | null {
  return null;
}
