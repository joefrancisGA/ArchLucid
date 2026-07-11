import type {
  IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING,
} from "@/lib/impact-preview-page-copy";

export type ImpactPreviewPageState =
  | "ready"
  | "no_candidates"
  | "no_baseline"
  | "permission_denied";

export type ImpactPreviewRecommendation =
  | typeof IMPACT_PREVIEW_RECOMMENDATION_PROCEED
  | typeof IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING
  | typeof IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW
  | typeof IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED;

export type ImpactPreviewComparisonScope = {
  readonly findings: boolean;
  readonly risk: boolean;
  readonly cost: boolean;
  readonly governance: boolean;
  readonly evidence: boolean;
};

export type ImpactPreviewBaselineOption = {
  readonly runId: string;
  readonly label: string;
};

export type ImpactPreviewSummaryMetrics = {
  readonly findingsChangedLabel: string;
  readonly risksReducedLabel: string;
  readonly risksIntroducedLabel: string;
  readonly costImpactLabel: string;
  readonly governanceStatusLabel: string;
};

export const DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE: ImpactPreviewComparisonScope = {
  findings: true,
  risk: true,
  cost: true,
  governance: true,
  evidence: true,
};
