import type { ProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";

export type { ProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";
export type ProductDocumentationAudience = "operator" | "buyer" | "marketing" | "developer";

/** PDF pipeline eligibility — `null` means not PDF-eligible (TB-722). */
export type ProductDocumentationPdfStatus = "public" | "customer" | "internal";

export type ProductDocumentationEntry = {
  slug: string;
  title: string;
  summary: string;
  audience: ProductDocumentationAudience;
  /**
   * Repo-relative markdown path(s); first entry is primary body.
   * Empty means the topic is app-rendered (no markdown body) — e.g. glossary from `customer-glossary-manifest.ts`.
   */
  sourcePaths: readonly string[];
  /** When set, only these `{#anchor}` H2 sections (plus optional intro) are rendered. */
  sectionAnchors?: readonly string[];
  /** Include markdown before the first `##` when `sectionAnchors` is set. */
  includeIntroWithSections?: boolean;
  /** IA taxonomy kind for `/help` (TB-732); unused by rendering until later phases. */
  contentKind: ProductDocumentationContentKind;
  pdfStatus: ProductDocumentationPdfStatus | null;
  lastReviewed?: string;
  releaseApplicability?: string;
};

export type ProductDocumentationRegistryInput = Omit<ProductDocumentationEntry, "pdfStatus" | "contentKind"> & {
  pdfStatus?: ProductDocumentationPdfStatus | null;
};
