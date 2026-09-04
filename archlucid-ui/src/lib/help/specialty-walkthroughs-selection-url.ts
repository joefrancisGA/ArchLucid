import { SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH } from "@/lib/specialty-walkthroughs-help-evidence-copy";
import {
  resolveSpecialtyReviewCloudFromSearchParam,
  specialtyReviewCloudQueryValue,
  type SpecialtyReviewCloudContext,
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";

export const SPECIALTY_WALKTHROUGH_TEMPLATE_PARAM = "template";
export const SPECIALTY_WALKTHROUGH_CLOUD_PARAM = "cloud";

const SPECIALTY_TEMPLATE_IDS = new Set<string>(["saas-readiness", "ai-governance", "healthcare-claims"]);

export function parseSpecialtyWalkthroughTemplateFromSearch(
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

export function parseSpecialtyWalkthroughCloudFromSearch(
  raw: string | null | undefined,
): SpecialtyReviewCloudContext {
  return resolveSpecialtyReviewCloudFromSearchParam(raw) ?? "None";
}

export function specialtyWalkthroughsSelectionHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly templateId?: SpecialtyReviewTemplateId | null;
    readonly cloudContext?: SpecialtyReviewCloudContext;
  },
  pathname: string = SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.templateId !== undefined) {
    if (patch.templateId === null) {
      params.delete(SPECIALTY_WALKTHROUGH_TEMPLATE_PARAM);
    } else {
      params.set(SPECIALTY_WALKTHROUGH_TEMPLATE_PARAM, patch.templateId);
    }
  }

  if (patch.cloudContext !== undefined) {
    if (patch.cloudContext === "None") {
      params.delete(SPECIALTY_WALKTHROUGH_CLOUD_PARAM);
    } else {
      params.set(SPECIALTY_WALKTHROUGH_CLOUD_PARAM, specialtyReviewCloudQueryValue(patch.cloudContext));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
