"use client";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IMPACT_PREVIEW_BASED_ON_EVIDENCE_LABEL,
  IMPACT_PREVIEW_ESTIMATED_IMPACT_LABEL,
  IMPACT_PREVIEW_RECOMMENDATION_DISCLAIMER,
  IMPACT_PREVIEW_RECOMMENDATION_TITLE,
  IMPACT_PREVIEW_SUGGESTED_NEXT_STEP_LABEL,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewRecommendation } from "@/lib/impact-preview-page-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ImpactPreviewRecommendationSectionProps = {
  readonly recommendation: ImpactPreviewRecommendation;
  readonly explanation: string | null;
};

export function ImpactPreviewRecommendationSection(props: ImpactPreviewRecommendationSectionProps): React.JSX.Element {
  return (
    <Card data-testid="impact-preview-recommendation-section">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{IMPACT_PREVIEW_RECOMMENDATION_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)} data-testid="impact-preview-recommendation-label">
          {props.recommendation}
        </p>
        {props.explanation !== null && props.explanation.trim().length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold">{IMPACT_PREVIEW_SUGGESTED_NEXT_STEP_LABEL}:</span> {props.explanation}
          </p>
        ) : null}
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
          {IMPACT_PREVIEW_RECOMMENDATION_DISCLAIMER}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IMPACT_PREVIEW_ESTIMATED_IMPACT_LABEL} · {IMPACT_PREVIEW_BASED_ON_EVIDENCE_LABEL}
        </p>
      </CardContent>
    </Card>
  );
}
