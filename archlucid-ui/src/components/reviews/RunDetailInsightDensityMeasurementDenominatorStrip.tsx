"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { HeldCheckLedgerRollupEntry, HeldCheckSecondPassSummary } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import type { ProseAssumptionHeldCheckAsk } from "@/lib/findings/read-prose-assumption-held-check-asks-from-findings-snapshot";
import type { ProseAssumptionRegisterEntry } from "@/lib/findings/read-prose-assumption-register-from-findings-snapshot";
import type { PixelDiagramNotVerifiableSource } from "@/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatHeldCheckLedgerRankedLabels,
  formatInsightDensityMeasurementFloorPresentation,
} from "@/lib/quality/insight-density-measurement-floor";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type RunDetailInsightDensityMeasurementDenominatorStripProps = {
  readonly enginesSucceeded?: number | null;
  readonly actorNodeCount?: number;
  readonly analysisStagesComplete?: boolean;
  readonly judgeSkippedByCap?: number | null;
  readonly judgeConfiguredCap?: number | null;
  readonly judgeEffectiveCap?: number | null;
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly heldCheckSecondPass?: HeldCheckSecondPassSummary | null;
  readonly proseAssumptionRegisterEntries?: readonly ProseAssumptionRegisterEntry[];
  readonly proseAssumptionHeldCheckAsks?: readonly ProseAssumptionHeldCheckAsk[];
  readonly pixelDiagramNotVerifiableSources?: readonly PixelDiagramNotVerifiableSource[];
  readonly className?: string;
  /** Hide engine-coverage copy when the review is in terminal failure (recovery owns the viewport). */
  readonly suppressOnTerminalFailure?: boolean;
};

/** LK-14: names the measured engine floor on Working stamp / export surfaces. */
export function RunDetailInsightDensityMeasurementDenominatorStrip(
  props: RunDetailInsightDensityMeasurementDenominatorStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode || props.suppressOnTerminalFailure === true) {
    return null;
  }

  const presentation = formatInsightDensityMeasurementFloorPresentation(props.enginesSucceeded ?? null, {
    actorNodeCount: props.actorNodeCount,
    analysisStagesComplete: props.analysisStagesComplete,
    judgeSkippedByCap: props.judgeSkippedByCap ?? null,
    judgeConfiguredCap: props.judgeConfiguredCap ?? null,
    judgeEffectiveCap: props.judgeEffectiveCap ?? null,
    heldCheckLedgerEntries: props.heldCheckLedgerEntries ?? [],
    heldCheckSecondPass: props.heldCheckSecondPass ?? null,
    proseAssumptionRegisterEntries: props.proseAssumptionRegisterEntries ?? [],
    proseAssumptionHeldCheckAsks: props.proseAssumptionHeldCheckAsks ?? [],
    pixelDiagramNotVerifiableSources: props.pixelDiagramNotVerifiableSources ?? [],
  });
  const heldCheckLabels = formatHeldCheckLedgerRankedLabels(presentation.heldCheckLedgerEntries);
  const proseAssumptionLabels = presentation.proseAssumptionRegisterLabels;
  const pixelDiagramLabels = presentation.pixelDiagramNotVerifiableLabels;

  return (
    <div className={cn("space-y-1", props.className)} data-testid="run-detail-stamp-measurement-denominator">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        {presentation.line}{" "}
        <Link className={OPERATOR_LINK.nav} href={presentation.helpHref}>
          Quality inventory
        </Link>
      </p>
      {heldCheckLabels.length > 0 ? (
        <ul className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)} data-testid="held-check-ledger-list">
          {heldCheckLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {proseAssumptionLabels.length > 0 ? (
        <ul
          className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="prose-assumption-register-list"
        >
          {proseAssumptionLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {pixelDiagramLabels.length > 0 ? (
        <ul
          className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="pixel-diagram-not-verifiable-list"
        >
          {pixelDiagramLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
