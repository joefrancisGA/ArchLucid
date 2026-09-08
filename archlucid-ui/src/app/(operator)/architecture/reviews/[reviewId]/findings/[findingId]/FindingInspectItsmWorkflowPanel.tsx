"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindingCorrelationVocabularyDisambiguation } from "@/components/findings/FindingCorrelationVocabularyDisambiguation";
import { ItsmConnectorsFindingTicketVocabularyRail } from "@/components/itsm/ItsmConnectorsFindingTicketVocabularyRail";
import { ItsmOutboundQuickActions } from "@/components/itsm/ItsmOutboundQuickActions";
import { ItsmOutboundTriadClarityStrip } from "@/components/itsm/ItsmOutboundTriadClarityStrip";
import { ITSM_TICKET_LINKAGE_CREATE_INTRO, ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED } from "@/lib/vocabulary/finding-correlation-vocabulary";
import { FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION } from "@/lib/findings/finding-human-review-display";
import {
  FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_BANNER,
  type FindingHumanReviewDispositionDivergence,
} from "@/lib/findings/finding-human-review-disposition-divergence";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInspectItsmWorkflowPanelProps = {
  readonly findingId: string;
  readonly humanReviewStatusLabel?: string | null;
  readonly humanReviewDispositionDivergence?: FindingHumanReviewDispositionDivergence | null;
};

/** TB-063: ITSM workflow on finding inspect. TB-387: one-click create gated; inbound sync + correlations remain. TB-2236: triad clarity. */
export function FindingInspectItsmWorkflowPanel({
  findingId,
  humanReviewStatusLabel = null,
  humanReviewDispositionDivergence = null,
}: FindingInspectItsmWorkflowPanelProps) {
  const nativeCreateEnabled = useItsmNativeCreateEnabled();
  const buyerPolishedShell = resolveProductionEvalChromeFromStorage();
  const isWorkingDesk = useProductionDeskChrome();
  const showDivergenceBanner =
    isWorkingDesk && humanReviewDispositionDivergence?.isDiverged === true;

  if (!nativeCreateEnabled && !humanReviewStatusLabel) {
    return (
      <div className="space-y-3">
        {buyerPolishedShell ? null : (
          <ItsmConnectorsFindingTicketVocabularyRail currentSurfaceId="finding-ticket-linkage" />
        )}
        <ItsmOutboundTriadClarityStrip />
        <ItsmOutboundQuickActions findingId={findingId} />
        {buyerPolishedShell ? null : (
          <FindingCorrelationVocabularyDisambiguation testId="finding-inspect-correlation-vocabulary" />
        )}
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
        {showDivergenceBanner ? (
          <div
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
            data-testid="finding-itsm-disposition-divergence-banner"
          >
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_BANNER}</p>
            {humanReviewDispositionDivergence?.reason ? (
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{humanReviewDispositionDivergence.reason}</p>
            ) : null}
          </div>
        ) : null}
        {buyerPolishedShell ? null : (
          <ItsmConnectorsFindingTicketVocabularyRail currentSurfaceId="finding-ticket-linkage" />
        )}
        <ItsmOutboundTriadClarityStrip />
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
        {buyerPolishedShell ? null : (
          <FindingCorrelationVocabularyDisambiguation testId="finding-inspect-correlation-vocabulary" />
        )}
      </CardContent>
    </Card>
  );
}
