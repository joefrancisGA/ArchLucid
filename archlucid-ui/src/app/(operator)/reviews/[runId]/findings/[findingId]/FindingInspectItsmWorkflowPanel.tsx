"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { useItsmNativeCreateEnabled } from "@/lib/use-itsm-native-create-enabled";

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
    return <ItsmOutboundQuickActions findingId={findingId} />;
  }

  return (
    <Card className="border-teal-200 dark:border-teal-900">
      <CardHeader>
        <CardTitle className="text-base">
          {nativeCreateEnabled ? "Sync to Jira or ServiceNow" : "External ticket linkage"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {humanReviewStatusLabel ? (
          <p className="text-al-text-secondary">
            Inbound sync human review: <span className="font-medium text-al-text-primary">{humanReviewStatusLabel}</span>
          </p>
        ) : null}
        {nativeCreateEnabled ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            Create a linked Jira issue or ServiceNow incident from this finding in one click. Duplicate creation per
            provider is blocked when a correlation already exists.
          </p>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400">
            One-click ticket creation is disabled in this environment. Use copy-as-work-item or register external
            tracking manually.
          </p>
        )}
        <ItsmOutboundQuickActions findingId={findingId} />
      </CardContent>
    </Card>
  );
}
