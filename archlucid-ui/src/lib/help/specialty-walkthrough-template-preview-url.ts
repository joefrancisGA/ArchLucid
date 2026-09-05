import type { SpecialtyReviewTemplateId } from "@/lib/specialty-review-templates";

export const SPECIALTY_WALKTHROUGH_TEMPLATE_PREVIEW_PARAM = "templatePreview";

const SPECIALTY_TEMPLATE_IDS = new Set<string>(["saas-readiness", "ai-governance", "healthcare-claims"]);

export function parseSpecialtyWalkthroughTemplatePreviewFromSearch(
  raw: string | null | undefined,
): SpecialtyReviewTemplateId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!SPECIALTY_TEMPLATE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as SpecialtyReviewTemplateId;
}

export function specialtyWalkthroughTemplatePreviewHrefFromSearch(
  currentSearch: string,
  templateId: SpecialtyReviewTemplateId | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (templateId === null) {
    params.delete(SPECIALTY_WALKTHROUGH_TEMPLATE_PREVIEW_PARAM);
  } else {
    params.set(SPECIALTY_WALKTHROUGH_TEMPLATE_PREVIEW_PARAM, templateId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
