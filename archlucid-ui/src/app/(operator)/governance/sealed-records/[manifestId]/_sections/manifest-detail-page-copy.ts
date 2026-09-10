import { SEALED_RECORD_DETAIL_PAGE_SUBTITLE_BUYER } from "@/lib/sealed-record-detail-page-copy";

export const MANIFEST_DETAIL_PAGE_SUBTITLE_OPERATOR =
  "Immutable authority for this review — decisions, findings, and downloadable deliverables linked from review detail.";

export function manifestDetailPageSubtitle(buyerPolishedLayout: boolean): string {
  return buyerPolishedLayout ? SEALED_RECORD_DETAIL_PAGE_SUBTITLE_BUYER : MANIFEST_DETAIL_PAGE_SUBTITLE_OPERATOR;
}
