import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export const REVIEW_GUIDE_REQUIRED_STATUS_LABELS = [
  "Required",
  "Conditional",
  "Optional",
  "Not applicable",
] as const;

export type ReviewGuideRequiredStatusLabel = (typeof REVIEW_GUIDE_REQUIRED_STATUS_LABELS)[number];

const LABEL_SET = new Set<string>(REVIEW_GUIDE_REQUIRED_STATUS_LABELS);

export function isReviewGuideRequiredStatusLabel(value: string): value is ReviewGuideRequiredStatusLabel {
  return LABEL_SET.has(value.trim());
}

export function mapReviewGuideRequiredStatusToTagKind(
  label: ReviewGuideRequiredStatusLabel,
): EnterpriseStatusKind {
  switch (label) {
    case "Required":
      return "needs-attention";
    case "Conditional":
      return "in-progress";
    case "Optional":
      return "draft";
    case "Not applicable":
      return "neutral";
    default: {
      const _exhaustive: never = label;
      return _exhaustive;
    }
  }
}
