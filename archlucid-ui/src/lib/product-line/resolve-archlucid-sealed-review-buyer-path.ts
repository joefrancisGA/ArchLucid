import {
  ARCHLUCID_SEALED_REVIEW_BUYER_PATH_LEAD,
  ARCHLUCID_SEALED_REVIEW_BUYER_PATH_NOT_SOURCES_LINE,
  ARCHLUCID_SEALED_REVIEW_COMPARE_HREF,
  ARCHLUCID_SEALED_REVIEW_COMPARE_LABEL,
  ARCHLUCID_SEALED_REVIEW_FINALIZE_HELP_HREF,
  ARCHLUCID_SEALED_REVIEW_FINALIZE_HELP_LABEL,
  ARCHLUCID_SEALED_REVIEW_SEALED_RECORDS_HREF,
  ARCHLUCID_SEALED_REVIEW_SEALED_RECORDS_LABEL,
} from "@/lib/product-line/archlucid-sealed-review-buyer-path-copy";

export type ArchLucidSealedReviewBuyerPathLink = { readonly href: string; readonly label: string };
export type ArchLucidSealedReviewBuyerPath = { readonly lead: string; readonly notSourcesLine: string; readonly links: readonly ArchLucidSealedReviewBuyerPathLink[] };

export function resolveArchLucidSealedReviewBuyerPath(): ArchLucidSealedReviewBuyerPath {
  return {
    lead: ARCHLUCID_SEALED_REVIEW_BUYER_PATH_LEAD,
    notSourcesLine: ARCHLUCID_SEALED_REVIEW_BUYER_PATH_NOT_SOURCES_LINE,
    links: [
      { href: ARCHLUCID_SEALED_REVIEW_FINALIZE_HELP_HREF, label: ARCHLUCID_SEALED_REVIEW_FINALIZE_HELP_LABEL },
      { href: ARCHLUCID_SEALED_REVIEW_COMPARE_HREF, label: ARCHLUCID_SEALED_REVIEW_COMPARE_LABEL },
      { href: ARCHLUCID_SEALED_REVIEW_SEALED_RECORDS_HREF, label: ARCHLUCID_SEALED_REVIEW_SEALED_RECORDS_LABEL },
    ],
  };
}
