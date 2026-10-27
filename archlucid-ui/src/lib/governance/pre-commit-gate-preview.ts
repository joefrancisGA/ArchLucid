import { findingSeverityLabelFromOrdinal } from "@/lib/pre-commit-governance-block-problem";
import type { PreCommitGateResult } from "@/lib/api/pre-finalize-synthetic-simulation-api";

export type PreCommitGatePreviewDisposition = "clear" | "warn" | "block" | "not-stored";

export type PreCommitGatePreviewView = {
  readonly disposition: PreCommitGatePreviewDisposition;
  readonly title: string;
  readonly detail: string;
  readonly policyPackId: string | null;
  readonly minimumBlockingSeverityLabel: string | null;
  readonly blockingFindingCount: number | null;
};

function gateOutcomeFieldsStored(gateResult: PreCommitGateResult): boolean {
  return (
    gateResult.blocked !== undefined
    || gateResult.warnOnly !== undefined
    || gateResult.blockingFindingIds !== undefined
    || gateResult.warnings !== undefined
  );
}

function formatBlockedDetail(
  reason: string | null,
  policyPackId: string | null,
  minimumBlockingSeverityLabel: string | null,
): string {
  if (reason !== null) {
    return reason;
  }

  const parts: string[] = [];

  if (policyPackId === null) {
    parts.push("Policy pack id was not stored.");
  }

  if (minimumBlockingSeverityLabel === null) {
    parts.push("Blocking severity was not stored.");
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return `Pack ${policyPackId} blocks at ${minimumBlockingSeverityLabel} severity or above.`;
}

function formatWarnDetail(
  warnings: readonly string[],
  reason: string | null,
  policyPackId: string | null,
): string {
  const warningLine = warnings[0]?.trim();

  if (warningLine !== undefined && warningLine.length > 0) {
    return warningLine;
  }

  if (reason !== null) {
    return reason;
  }

  if (policyPackId === null) {
    return "Policy pack id was not stored.";
  }

  return `Pack ${policyPackId} is in warn-only mode for this threshold.`;
}

/** Operator-facing preview of a pre-finalize simulate result for the finalize CTA area. */
export function resolvePreCommitGatePreviewView(
  gateResult: PreCommitGateResult | null | undefined,
): PreCommitGatePreviewView | null {
  if (gateResult === null || gateResult === undefined) {
    return null;
  }

  if (!gateOutcomeFieldsStored(gateResult)) {
    return {
      disposition: "not-stored",
      title: "Pre-commit gate result was not stored.",
      detail: "Pre-commit gate result was not stored.",
      policyPackId: gateResult.policyPackId?.trim() ?? null,
      minimumBlockingSeverityLabel:
        gateResult.minimumBlockingSeverity === null || gateResult.minimumBlockingSeverity === undefined
          ? null
          : findingSeverityLabelFromOrdinal(gateResult.minimumBlockingSeverity),
      blockingFindingCount: null,
    };
  }

  const blocked = gateResult.blocked === true;
  const warnOnly = gateResult.warnOnly === true;
  const warnings = gateResult.warnings ?? [];
  const policyPackId = gateResult.policyPackId?.trim() ?? null;
  const minimumBlockingSeverityLabel =
    gateResult.minimumBlockingSeverity === null || gateResult.minimumBlockingSeverity === undefined
      ? null
      : findingSeverityLabelFromOrdinal(gateResult.minimumBlockingSeverity);
  const blockingFindingCount =
    gateResult.blockingFindingIds === undefined ? null : (gateResult.blockingFindingIds?.length ?? 0);
  const reason = gateResult.reason?.trim() ?? null;

  if (blocked) {
    return {
      disposition: "block",
      title: "Pre-commit policy would block finalize",
      detail: formatBlockedDetail(reason, policyPackId, minimumBlockingSeverityLabel),
      policyPackId,
      minimumBlockingSeverityLabel,
      blockingFindingCount,
    };
  }

  if (warnOnly || warnings.length > 0) {
    return {
      disposition: "warn",
      title: "Pre-commit policy warns before finalize",
      detail: formatWarnDetail(warnings, reason, policyPackId),
      policyPackId,
      minimumBlockingSeverityLabel,
      blockingFindingCount,
    };
  }

  if (gateResult.blocked === false && gateResult.warnOnly === false) {
    return {
      disposition: "clear",
      title: "Pre-commit gate clear",
      detail:
        policyPackId !== null
          ? `Assigned pack ${policyPackId} would allow finalize at the current severity floor.`
          : "No pre-commit blockers detected for the current findings snapshot.",
      policyPackId,
      minimumBlockingSeverityLabel,
      blockingFindingCount,
    };
  }

  return {
    disposition: "not-stored",
    title: "Pre-commit gate result was not stored.",
    detail: "Pre-commit gate result was not stored.",
    policyPackId,
    minimumBlockingSeverityLabel,
    blockingFindingCount,
  };
}
