"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useFindingKeyboardTriage } from "@/components/governance/findings/FindingKeyboardTriageContext";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type FindingListDispositionRowActionsProps = {
  readonly findingId: string;
  readonly compact?: boolean;
};

/** Working-mode list row actions — reuse keyboard triage host disposition flow (WA-18). */
export function FindingListDispositionRowActions(
  props: FindingListDispositionRowActionsProps,
): ReactElement | null {
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const triage = useFindingKeyboardTriage();

  if (!architectWorkspaceChrome || triage === null) {
    return null;
  }

  const blockedReason = triage.isDispositionBlocked(props.findingId);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", props.compact === true ? "mt-2" : "mt-3")}
      data-testid={`finding-list-disposition-actions-${props.findingId}`}
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!triage.mutationsEnabled || blockedReason !== null}
        title={blockedReason ?? undefined}
        onClick={() => {
          triage.requestDisposition(props.findingId, "Accepted");
        }}
        data-testid={`finding-list-accept-${props.findingId}`}
      >
        Accept
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!triage.mutationsEnabled || blockedReason !== null}
        title={blockedReason ?? undefined}
        onClick={() => {
          triage.requestDisposition(props.findingId, "Remediated");
        }}
        data-testid={`finding-list-remediate-${props.findingId}`}
      >
        Remediate
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!triage.mutationsEnabled || blockedReason !== null}
        title={blockedReason ?? undefined}
        onClick={() => {
          triage.requestDisposition(props.findingId, "RejectedAsNotApplicable");
        }}
        data-testid={`finding-list-reject-${props.findingId}`}
      >
        Reject N/A
      </Button>
      {blockedReason !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {blockedReason}
        </p>
      ) : null}
    </div>
  );
}
