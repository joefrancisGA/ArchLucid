"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { PRE_COMMIT_GATE_DISABLED_CAREER_COPY } from "@/lib/governance/pre-commit-gate-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailPreFinalizeGateHonestyStripProps = {
  readonly className?: string;
};

/** DR-04: persistent Working banner when the host leaves the pre-finalize governance gate off. */
export function RunDetailPreFinalizeGateHonestyStrip(
  props: RunDetailPreFinalizeGateHonestyStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });
  const preCommitGateEnabled = healthQuery.data?.preCommitGateEnabled;

  if (!isWorkingMode || preCommitGateEnabled !== false) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.warnShell, "p-4", props.className)}
      data-testid="run-detail-pre-finalize-gate-honesty-strip"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Pre-finalize governance gate is off
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {PRE_COMMIT_GATE_DISABLED_CAREER_COPY}
      </p>
    </div>
  );
}
