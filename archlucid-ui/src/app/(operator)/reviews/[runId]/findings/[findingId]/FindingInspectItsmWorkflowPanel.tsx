"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";

export type FindingInspectItsmWorkflowPanelProps = {
  readonly findingId: string;
  readonly humanReviewStatusLabel?: string | null;
};

/** TB-063: one-click Jira / ServiceNow outbound from finding inspect. */
export function FindingInspectItsmWorkflowPanel({
  findingId,
  humanReviewStatusLabel = null,
}: FindingInspectItsmWorkflowPanelProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">ITSM work items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {humanReviewStatusLabel ? (
          <p className="text-al-text-secondary">
            Inbound sync human review: <span className="font-medium text-al-text-primary">{humanReviewStatusLabel}</span>
          </p>
        ) : null}
        <p className="text-neutral-500 dark:text-neutral-400">
          Create a linked Jira issue or ServiceNow incident from this finding. Duplicate creation per provider is
          blocked when a correlation already exists.
        </p>
        <ItsmOutboundQuickActions findingId={findingId} />
      </CardContent>
    </Card>
  );
}
