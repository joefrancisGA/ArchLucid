"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import {
  PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
  PRE_COMMIT_GATE_DISABLED_TITLE,
} from "@/lib/governance/pre-commit-gate-career-honesty";
import {
  countUncheckedDecisionGradeSemanticSupportBands,
  formatUncheckedSemanticSupportFinalizeCopy,
  shouldShowUncheckedSemanticSupportFinalizeWarning,
  UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_TITLE,
} from "@/lib/findings/semantic-support-band-finalize-honesty";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailPreFinalizeGateHonestyStripProps = {
  readonly className?: string;
  readonly findings?: readonly QuickDecisionFinding[];
  readonly manifestFinalized?: boolean;
};

/** DR-04 / AS-064: persistent Working banners before finalize (policy gate + Unchecked semantic support). */
export function RunDetailPreFinalizeGateHonestyStrip(
  props: RunDetailPreFinalizeGateHonestyStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });
  const preCommitGateEnabled = healthQuery.data?.preCommitGateEnabled;
  const findings = props.findings ?? [];
  const manifestFinalized = props.manifestFinalized === true;

  const showPreCommitGateHonesty = isWorkingMode && preCommitGateEnabled === false;
  const showUncheckedSemanticSupportHonesty = shouldShowUncheckedSemanticSupportFinalizeWarning({
    workingDesk: isWorkingMode,
    manifestFinalized,
    findings,
  });

  if (!showPreCommitGateHonesty && !showUncheckedSemanticSupportHonesty) {
    return null;
  }

  const uncheckedCount = countUncheckedDecisionGradeSemanticSupportBands(findings);

  return (
    <div className={cn("space-y-3", props.className)} data-testid="run-detail-pre-finalize-honesty-strip-group">
      {showPreCommitGateHonesty ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warnShell, "p-4")}
          data-testid="run-detail-pre-finalize-gate-honesty-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {PRE_COMMIT_GATE_DISABLED_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {PRE_COMMIT_GATE_DISABLED_CAREER_COPY}
          </p>
        </div>
      ) : null}
      {showUncheckedSemanticSupportHonesty ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warnShell, "p-4")}
          data-testid="run-detail-pre-finalize-unchecked-semantic-support-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {formatUncheckedSemanticSupportFinalizeCopy(uncheckedCount)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
