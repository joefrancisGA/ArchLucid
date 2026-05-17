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
    return [
      "Decision: Approved with monitoring",
      "Remaining risk: PHI minimization at the intake boundary",
      "Monitoring cadence: Weekly exception-volume review",
    ].join("\n");
  }

  if (postureRaw === "approved with monitoring") {
    return "Approved with monitoring — proceed under the controls documented in this sealed package.";
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

  const gateRaw = (input.governanceGateLabel ?? "").trim() || "Pending";
  const gate = gateRaw === "Passed" ? "Approved with monitoring" : gateRaw;
  const postureRaw = (input.aggregateRiskPosture ?? "").trim();
  const posture =
    postureRaw.length > 0 && postureRaw.toLowerCase() !== "not rated" ? postureRaw : null;

  const findingPhrase =
    findings === null
      ? "Finding counts appear in the strip below."
      : unresolved !== null && unresolved > 0
        ? `${findings} finding${findings === 1 ? "" : "s"} recorded with ${unresolved} unresolved issue${unresolved === 1 ? "" : "s"} still tracked on the manifest.`
        : `${findings} finding${findings === 1 ? "" : "s"} recorded with no blocking items left open for this package.`;

  const warningPhrase =
    warnings !== null && warnings > 0
      ? ` ${warnings} non-blocking monitored risk${warnings === 1 ? "" : "s"} remain on the sealed record.`
      : "";

  const lead =
    posture !== null
      ? `Finalized package — ${posture}; governance gate ${gate}.`
      : `Finalized package — governance gate ${gate}.`;

  return `${lead} ${findingPhrase}${warningPhrase}`;
}
