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

  if (postureRaw === "approved with monitoring") {
    return "Approved with monitoring — open the finalized review record for monitored risks and governance follow-up.";
  }

  const gate = (input.governanceGateLabel ?? "").trim();

  if (gate.length > 0) {
    return `Finalized review — governance gate: ${gate}.`;
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
    const warnings = clampNonNegativeInt(input.warningCountDisplay);

    if (warnings === null) {
      return "The review is finalized; monitored risk count was not stored.";
    }

    if (warnings === 1) {
      return "The review is finalized; 1 non-blocking monitored risk remains on the record.";
    }

    return `The review is finalized; ${warnings} non-blocking monitored risks remain on the record.`;
  }

  return null;
}

/**
 * One buyer-facing sentence synthesizing finalized state, disposition posture, approval gate, findings, and warnings.
 */
export function buildBuyerReviewPackageDispositionLine(input: BuyerReviewDispositionInput): string {
  if (!input.hasGoldenManifest) {
    return "Finalize the review to lock findings, monitored risks, and approval signals for this review.";
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
          : unresolved === null
            ? `${findings} finding${findings === 1 ? "" : "s"} recorded; unresolved issue count was not stored.`
            : `${findings} finding${findings === 1 ? "" : "s"} recorded with no blocking items left open for this review.`;

  const warningPhrase =
    warnings !== null && warnings > 0 && unresolved !== null && unresolved > 0
      ? ` ${warnings} non-blocking monitored risk${warnings === 1 ? "" : "s"} remain on the finalized review record.`
      : "";

  const gate = (input.governanceGateLabel ?? "").trim();

  const lead =
    posture !== null
      ? `Finalized package — ${posture}.`
      : "Finalized package — risk posture was not stored.";

  const gateClause =
    gate.length > 0 ? ` Governance gate on record: ${gate}.` : "";

  return `${lead}${gateClause} ${findingPhrase}${warningPhrase}`;
}
