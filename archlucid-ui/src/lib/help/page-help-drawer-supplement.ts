import type { PageContextualHelpAction } from "@/lib/contextual-help/types";
import { pageHelpDrawerKeyPointsForSlug } from "@/lib/help/page-help-drawer-supplement-entries";
import type { PageHelpDrawerSupplement } from "@/lib/help/page-help-drawer-supplement-types";
import { getProductDocumentationEntry, normalizeHelpTopicSlug } from "@/lib/product-documentation-registry";

export type { PageHelpDrawerSupplement } from "@/lib/help/page-help-drawer-supplement-types";

function normalizeDrawerCopy(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldShowDrawerSupplementDetail(detail: string, whatIsThisPage: string): boolean {
  const normalizedDetail = normalizeDrawerCopy(detail);
  const normalizedSummary = normalizeDrawerCopy(whatIsThisPage);

  if (normalizedDetail.length === 0 || normalizedSummary.length === 0) {
    return normalizedDetail.length > 0;
  }

  if (normalizedDetail === normalizedSummary) {
    return false;
  }

  if (normalizedDetail.includes(normalizedSummary) || normalizedSummary.includes(normalizedDetail)) {
    return false;
  }

  const detailWords = new Set(normalizedDetail.split(" ").filter((word) => word.length > 3));
  const summaryWords = new Set(normalizedSummary.split(" ").filter((word) => word.length > 3));
  let intersection = 0;

  for (const word of detailWords) {
    if (summaryWords.has(word)) {
      intersection += 1;
    }
  }

  const union = detailWords.size + summaryWords.size - intersection;

  if (union === 0) {
    return true;
  }

  return intersection / union < 0.6;
}

export function dedupeDrawerRelatedLinks(
  relatedLinks: readonly PageContextualHelpAction[] | undefined,
  existingHrefs: readonly string[],
): readonly PageContextualHelpAction[] {
  if (relatedLinks == null || relatedLinks.length === 0) {
    return [];
  }

  const seen = new Set(existingHrefs.map((href) => href.trim()).filter((href) => href.length > 0));

  return relatedLinks.filter((link) => {
    const href = link.href.trim();

    if (href.length === 0 || seen.has(href)) {
      return false;
    }

    seen.add(href);
    return true;
  });
}

export function pageHelpDrawerSupplementForSlug(slug: string | null | undefined): PageHelpDrawerSupplement | null {
  const normalizedSlug = normalizeHelpTopicSlug(slug?.trim() ?? "");

  if (normalizedSlug.length === 0) {
    return null;
  }

  const documentationEntry = getProductDocumentationEntry(normalizedSlug);
  const summary = documentationEntry?.summary.trim() ?? "";
  const keyPoints = pageHelpDrawerKeyPointsForSlug(normalizedSlug);

  if (summary.length === 0 && (keyPoints == null || keyPoints.length === 0)) {
    return null;
  }

  return {
    detail: summary.length > 0 ? summary : undefined,
    keyPoints,
  };
}
