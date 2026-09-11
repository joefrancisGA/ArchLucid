"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import {
  shouldSuppressReadyToFinalizeForSimulatorRehearsal,
  WORKING_SIMULATOR_CAREER_READY_SUPPRESSED_COPY,
  WORKING_SIMULATOR_CAREER_READY_SUPPRESSED_TITLE,
} from "@/lib/governance/simulator-career-honesty";
import {
  WORKING_REHEARSAL_READY_SUPPRESSED_COPY,
  WORKING_REHEARSAL_READY_SUPPRESSED_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { shouldSuppressReadyToFinalizeForWorkingRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import {
  PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
  PRE_COMMIT_GATE_DISABLED_TITLE,
} from "@/lib/governance/pre-commit-gate-career-honesty";
import {
  countUncheckedDecisionGradeSemanticSupportBands,
  countUnsupportedDecisionGradeSemanticSupportBands,
  formatUncheckedSemanticSupportFinalizeCopy,
  resolveUnsupportedSemanticSupportFinalizeBlockedReason,
  shouldApplyUnsupportedSemanticSupportFinalizeHold,
  shouldShowUncheckedSemanticSupportFinalizeWarning,
  shouldShowUnsupportedSemanticSupportHoldOffHonesty,
  UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_TITLE,
  UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_COPY,
  UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_TITLE,
  UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_COPY,
  UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_TITLE,
} from "@/lib/findings/semantic-support-band-finalize-honesty";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailPreFinalizeGateHonestyStripProps = {
  readonly className?: string;
  readonly findings?: readonly QuickDecisionFinding[];
  readonly manifestFinalized?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
};

/** DR-04 / AS-064 / AS-065: persistent Working banners before finalize. */
export function RunDetailPreFinalizeGateHonestyStrip(
  props: RunDetailPreFinalizeGateHonestyStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });
  const preCommitGateEnabled = healthQuery.data?.preCommitGateEnabled;
  const hostQualityGateMode = healthQuery.data?.agentOutputQualityGateMode ?? null;
  const pilotStrictHoldOnUnsupportedSemanticSupport =
    healthQuery.data?.pilotStrictHoldOnUnsupportedSemanticSupport ?? null;
  const findings = props.findings ?? [];
  const manifestFinalized = props.manifestFinalized === true;

  const showPreCommitGateHonesty = isWorkingMode && preCommitGateEnabled === false;
  const effectiveWorkingCareerRehearsalDoor = resolveHonestyWorkingCareerRehearsalDoor({
    stampedDoor: props.workingCareerRehearsalDoor,
    liveDoor: effectiveDoor,
  });
  const showRehearsalDoorReadySuppressedHonesty = shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
    workingDesk: isWorkingMode,
    effectiveWorkingCareerRehearsalDoor,
  });
  const showSimulatorCareerReadySuppressedHonesty =
    isWorkingMode
    && shouldSuppressReadyToFinalizeForSimulatorRehearsal({
      workingDesk: isWorkingMode,
      structuralExecutionMode: props.structuralExecutionMode,
      effectiveWorkingCareerRehearsalDoor,
    });
  const showUncheckedSemanticSupportHonesty = shouldShowUncheckedSemanticSupportFinalizeWarning({
    workingDesk: isWorkingMode,
    manifestFinalized,
    findings,
  });
  const showUnsupportedHoldOffHonesty = shouldShowUnsupportedSemanticSupportHoldOffHonesty({
    workingDesk: isWorkingMode,
    manifestFinalized,
    findings,
    pilotStrictHoldOnUnsupportedSemanticSupport,
  });
  const unsupportedHoldApplies = shouldApplyUnsupportedSemanticSupportFinalizeHold({
    workingDesk: isWorkingMode,
    manifestFinalized,
    structuralExecutionMode: props.structuralExecutionMode,
    hostQualityGateMode,
    pilotStrictHoldOnUnsupportedSemanticSupport,
  });
  const unsupportedHoldBlockedReason = resolveUnsupportedSemanticSupportFinalizeBlockedReason({
    workingDesk: isWorkingMode,
    manifestFinalized,
    findings,
    structuralExecutionMode: props.structuralExecutionMode,
    hostQualityGateMode,
    pilotStrictHoldOnUnsupportedSemanticSupport,
  });
  const showUnsupportedHoldBlocking = unsupportedHoldApplies && unsupportedHoldBlockedReason !== null;

  if (
    !showPreCommitGateHonesty
    && !showRehearsalDoorReadySuppressedHonesty
    && !showSimulatorCareerReadySuppressedHonesty
    && !showUncheckedSemanticSupportHonesty
    && !showUnsupportedHoldOffHonesty
    && !showUnsupportedHoldBlocking
  ) {
    return null;
  }

  const uncheckedCount = countUncheckedDecisionGradeSemanticSupportBands(findings);
  const unsupportedCount = countUnsupportedDecisionGradeSemanticSupportBands(findings);

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
      {showRehearsalDoorReadySuppressedHonesty ? (
        <div
          className={cn(DESIGN_TOKENS.callout.info, "p-4")}
          data-testid="run-detail-pre-finalize-rehearsal-door-honesty-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {WORKING_REHEARSAL_READY_SUPPRESSED_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {WORKING_REHEARSAL_READY_SUPPRESSED_COPY}
          </p>
        </div>
      ) : null}
      {showSimulatorCareerReadySuppressedHonesty ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warnShell, "p-4")}
          data-testid="run-detail-pre-finalize-simulator-career-honesty-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {WORKING_SIMULATOR_CAREER_READY_SUPPRESSED_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {WORKING_SIMULATOR_CAREER_READY_SUPPRESSED_COPY}
          </p>
        </div>
      ) : null}
      {showUnsupportedHoldBlocking ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warnShell, "p-4")}
          data-testid="run-detail-pre-finalize-unsupported-semantic-support-hold-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_COPY} {unsupportedHoldBlockedReason}
          </p>
        </div>
      ) : null}
      {showUnsupportedHoldOffHonesty ? (
        <div
          className={cn(DESIGN_TOKENS.callout.info, "p-4")}
          data-testid="run-detail-pre-finalize-unsupported-hold-off-honesty-strip"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_COPY} {unsupportedCount} Unsupported decision-grade finding
            {unsupportedCount === 1 ? "" : "s"} remain visible; finalize stays enabled.
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
