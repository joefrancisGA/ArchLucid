"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { FindingCorrelationVocabularyDisambiguation } from "@/components/FindingCorrelationVocabularyDisambiguation";
import { ITSM_TICKET_LINKAGE_CREATE_INTRO, ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED } from "@/lib/finding-correlation-vocabulary";
import { FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION } from "@/lib/finding-human-review-display";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInspectItsmWorkflowPanelProps = {
  readonly findingId: string;
  readonly humanReviewStatusLabel?: string | null;
};

/** TB-063: ITSM workflow on finding inspect. TB-387: one-click create gated; inbound sync + correlations remain. */
export function FindingInspectItsmWorkflowPanel({
  findingId,
  humanReviewStatusLabel = null,
}: FindingInspectItsmWorkflowPanelProps) {
  const nativeCreateEnabled = useItsmNativeCreateEnabled();

  if (!nativeCreateEnabled && !humanReviewStatusLabel) {
    return (
      <div className="space-y-3">
        <ItsmOutboundQuickActions findingId={findingId} />
        <FindingCorrelationVocabularyDisambiguation testId="finding-inspect-correlation-vocabulary" />
      </div>
    );
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {nativeCreateEnabled ? "Sync to Jira or ServiceNow" : "External ticket linkage"}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        {humanReviewStatusLabel ? (
          <div className={cn("space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              Inbound sync human review:{" "}
              <span className="font-medium text-al-text-primary">{humanReviewStatusLabel}</span>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION}</p>
          </div>
        ) : null}
        {nativeCreateEnabled ? (
          <p className="text-al-text-secondary">
            {ITSM_TICKET_LINKAGE_CREATE_INTRO} {ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED}
          </p>
        ) : (
          <p className="text-al-text-secondary">
            One-click ticket creation is disabled in this environment. Use copy-as-work-item or register external
            tracking manually.
          </p>
        )}
        <ItsmOutboundQuickActions findingId={findingId} />
        <FindingCorrelationVocabularyDisambiguation testId="finding-inspect-correlation-vocabulary" />
      </CardContent>
    </Card>
  );
}
