"use client";

import { useMemo } from "react";

import { CreateWorkItemButton } from "@/components/work-items/CreateWorkItemButton";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type FindingCreateWorkItemActionsProps = {
  readonly runId: string;
  readonly finding: QuickDecisionFinding;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly ownerLabel: string | null;
  readonly allFindings: readonly QuickDecisionFinding[];
};

/** Provider-neutral finding-row work item affordance for architecture-creation review detail. */
export function FindingCreateWorkItemActions(props: FindingCreateWorkItemActionsProps): React.JSX.Element {
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const scopedFindings = useMemo(
    () => props.allFindings.filter((finding) => finding.findingId === props.finding.findingId),
    [props.allFindings, props.finding.findingId],
  );

  return (
    <div
      className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800"
      data-testid={`finding-create-work-item-${props.finding.findingId}`}
    >
      <p className={cn("m-0 mb-1", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
        Work management
      </p>
      <CreateWorkItemButton
        runId={props.runId}
        architectureName={props.architectureName}
        architectureOverview={props.architectureOverview}
        ownerLabel={props.ownerLabel}
        findings={scopedFindings}
        siteOrigin={siteOrigin}
        compact
      />
    </div>
  );
}
