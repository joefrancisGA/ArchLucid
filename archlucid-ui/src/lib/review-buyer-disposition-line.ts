export type BuyerReviewDispositionInput = {
  readonly hasGoldenManifest: boolean;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly unresolvedIssueCountDisplay: number | null;
  readonly governanceGateLabel: string | null | undefined;
  readonly aggregateRiskPosture: string | null | undefined;
};

function clampNonNegativeInt(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

/**
 * Single headline sentence for buyer-polished review detail — plain language before the metric strip.
 */
export function buildBuyerReviewPackagePlainStatusHeadline(input: BuyerReviewDispositionInput): string | null {
  if (!input.hasGoldenManifest) {
    return null;
  }

  const postureRaw = (input.aggregateRiskPosture ?? "").trim().toLowerCase();
  const warnings = clampNonNegativeInt(input.warningCountDisplay);
  const unresolved = clampNonNegativeInt(input.unresolvedIssueCountDisplay);

  if (postureRaw === "approved with monitoring" && warnings === 1 && (unresolved === null || unresolved === 0)) {
    return "Approved for implementation planning. No blocking issues. One PHI minimization risk accepted with weekly monitoring.";
  }

  if (postureRaw === "approved with monitoring") {
    return "Approved with monitoring — proceed under the controls documented in this finalized signed review package.";
  }

  return null;
}

/**
 * Short caption beside the title row pipeline pill — keeps the PHI-specific paragraph in the outcome strip only.
 */
export function buyerHeaderStatusTwinPillCaption(input: BuyerReviewDispositionInput): string | null {
  if (!input.hasGoldenManifest) {
    return null;
  }

  const postureRaw = (input.aggregateRiskPosture ?? "").trim().toLowerCase();

  if (postureRaw === "approved with monitoring") {
    return "The review package is finalized; one non-blocking risk remains under explicit monitored oversight.";
  }

  return null;
}

/**
 * One buyer-facing sentence synthesizing finalized state, disposition posture, governance gate, findings, and warnings.
 */
export function buildBuyerReviewPackageDispositionLine(input: BuyerReviewDispositionInput): string {
  if (!input.hasGoldenManifest) {
    return "Finalize the reviewed manifest to lock findings, monitored risks, and governance approval signals for this package.";
  }

  const findings = clampNonNegativeInt(input.findingCountDisplay);
  const warnings = clampNonNegativeInt(input.warningCountDisplay);
  const unresolved = clampNonNegativeInt(input.unresolvedIssueCountDisplay);

  const postureRaw = (input.aggregateRiskPosture ?? "").trim();
  const posture =
    postureRaw.length > 0 && postureRaw.toLowerCase() !== "not rated" ? postureRaw : null;

  const includesMonitoredRiskInFindingPhrase =
    warnings !== null && warnings > 0 && (unresolved === null || unresolved === 0);

  const findingPhrase =
    findings === null
      ? "Finding counts appear in the strip below."
      : unresolved !== null && unresolved > 0
        ? `${findings} finding${findings === 1 ? "" : "s"} recorded with ${unresolved} unresolved issue${unresolved === 1 ? "" : "s"} still tracked on the manifest.`
        : includesMonitoredRiskInFindingPhrase && findings !== null
          ? `${findings} finding${findings === 1 ? "" : "s"}, including ${warnings} non-blocking monitored risk${warnings === 1 ? "" : "s"}.`
          : `${findings} finding${findings === 1 ? "" : "s"} recorded with no blocking items left open for this package.`;

  const warningPhrase =
    warnings !== null && warnings > 0 && unresolved !== null && unresolved > 0
      ? ` ${warnings} non-blocking monitored risk${warnings === 1 ? "" : "s"} remain on the finalized signed record.`
      : "";

  const lead =
    posture !== null && posture.toLowerCase() === "approved with monitoring"
      ? `Approved for implementation planning with ${warnings ?? 1} monitored risk${warnings === 1 ? "" : "s"} under active oversight.`
      : posture !== null
        ? `Finalized package — ${posture}.`
        : "Finalized package — governance complete.";

  return `${lead} ${findingPhrase}${warningPhrase}`;
}
