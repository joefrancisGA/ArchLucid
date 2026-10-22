import { findingSeverityLabelFromOrdinal } from "@/lib/pre-commit-governance-block-problem";
import type { PreCommitGateResult } from "@/lib/api/pre-finalize-synthetic-simulation-api";

export type PreCommitGatePreviewDisposition = "clear" | "warn" | "block";

export type PreCommitGatePreviewView = {
  readonly disposition: PreCommitGatePreviewDisposition;
  readonly title: string;
  readonly detail: string;
  readonly policyPackId: string | null;
  readonly minimumBlockingSeverityLabel: string | null;
  readonly blockingFindingCount: number;
};

/** Operator-facing preview of a pre-finalize simulate result for the finalize CTA area. */
export function resolvePreCommitGatePreviewView(
  gateResult: PreCommitGateResult | null | undefined,
): PreCommitGatePreviewView | null {
  if (gateResult === null || gateResult === undefined) {
    return null;
  }

  const blocked = gateResult.blocked === true;
  const warnOnly = gateResult.warnOnly === true;
  const warnings = gateResult.warnings ?? [];
  const policyPackId = gateResult.policyPackId?.trim() ?? null;
  const minimumBlockingSeverityLabel =
    gateResult.minimumBlockingSeverity === null || gateResult.minimumBlockingSeverity === undefined
      ? null
      : findingSeverityLabelFromOrdinal(gateResult.minimumBlockingSeverity);
  const blockingFindingCount = gateResult.blockingFindingIds?.length ?? 0;
  const reason = gateResult.reason?.trim() ?? null;

  if (blocked) {
    return {
      disposition: "block",
      title: "Pre-commit policy would block finalize",
      detail:
        reason ??
        `Pack ${policyPackId ?? "unknown"} blocks at ${minimumBlockingSeverityLabel ?? "configured"} severity or above.`,
      policyPackId,
      minimumBlockingSeverityLabel,
      blockingFindingCount,
    };
  }

  if (warnOnly || warnings.length > 0) {
    const warningLine = warnings[0]?.trim();

    return {
      disposition: "warn",
      title: "Pre-commit policy warns before finalize",
      detail:
        warningLine ??
        reason ??
        `Pack ${policyPackId ?? "assigned"} is in warn-only mode for this threshold.`,
      policyPackId,
      minimumBlockingSeverityLabel,
      blockingFindingCount,
    };
  }

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
