import type { SpecialtyReviewTemplateId } from "@/lib/specialty-review-templates";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (templateId === null) {
      params.delete(SPECIALTY_WALKTHROUGH_TEMPLATE_PREVIEW_PARAM);
    } else {
      params.set(SPECIALTY_WALKTHROUGH_TEMPLATE_PREVIEW_PARAM, templateId);
    }
    },
  });
}
