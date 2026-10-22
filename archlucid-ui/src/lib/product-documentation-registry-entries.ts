/**
 * Customer-visible in-app documentation registry entries.
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import { PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_ADMIN } from "./product-documentation-registry-entries-admin";
import { PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_BUYER } from "./product-documentation-registry-entries-buyer";
import { PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_OPERATOR } from "./product-documentation-registry-entries-operator";

import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_INPUT: readonly ProductDocumentationRegistryInput[] = [
  ...PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_BUYER,
  ...PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_OPERATOR,
  ...PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_ADMIN,
] as const;
