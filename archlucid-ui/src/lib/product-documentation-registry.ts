/**
 * Customer-visible in-app documentation registry.
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
export type {
  ProductDocumentationContentKind,
  ProductDocumentationAudience,
  ProductDocumentationPdfStatus,
  ProductDocumentationEntry,
  ProductDocumentationRegistryInput,
} from "./product-documentation-registry-types";

export { PRODUCT_DOCUMENTATION_REGISTRY_INPUT } from "./product-documentation-registry-entries";

export {
  PRODUCT_DOCUMENTATION_REGISTRY,
  getProductDocumentationEntry,
  inAppHelpHref,
  listProductDocumentationEntries,
  normalizeHelpTopicSlug,
} from "./product-documentation-registry-helpers";
