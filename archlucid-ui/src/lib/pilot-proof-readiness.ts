/**
 * Maps persisted `GET /v1/pilots/runs/{runId}/pilot-run-deltas` proof fields into sponsor-banner copy.
 * Business rules are enforced server-side — the UI reflects JSON, with legacy fallbacks when older APIs omit fields.
 */

export type RoiBaselineInputsJson = {
  readonly reviewCycleHoursBasis?: string;
  readonly architectPrepHoursPerReviewBasis?: string;
  readonly evidenceAssemblyEffortBasis?: string;
  readonly architectHourlyCostBasis?: string;
  readonly projectedDollarClaimsSponsorSafe?: boolean;
  readonly sponsorSafeFallbackCopy?: string;
};

export type ProofPackageCompletenessJson = {
  readonly sponsorProofReadiness?: string;
  readonly demoTenantWarningRequired?: boolean;
  readonly proofSendability?: string;
  readonly publishingTier?: string;
  readonly roiEvidenceConfidence?: string;
  readonly roiBaselineInputs?: RoiBaselineInputsJson | null;
  readonly agentOutputPilotStrictEvidenceSatisfied?: boolean;
  readonly llmCallCount?: number;
  readonly llmCallCountResolved?: boolean;
};

export type PilotRunDeltasProofSummaryJson = {
  readonly isDemoTenant?: boolean;
  readonly estimatedUsdSavings?: number | null;
  readonly proofPackageCompleteness?: ProofPackageCompletenessJson | null;
};

export type SponsorProofReadinessCopy = {
  readonly variant: "blocked" | "caveats" | "ready" | "unknown";
  readonly classification: "Sendable" | "NeedsBaseline" | "DemoOnly" | "Incomplete" | null;
  readonly title: string;
  readonly detail: string;
};

/**
 * @param payload Parsed pilot-run-deltas JSON, or null when the request failed or body was empty.
 */
/** When false or absent, sponsor UI must not lead with projected USD savings from findings rollups. */
export function isProjectedDollarClaimsSponsorSafe(
  payload: PilotRunDeltasProofSummaryJson | null,
): boolean {
  return payload?.proofPackageCompleteness?.roiBaselineInputs?.projectedDollarClaimsSponsorSafe === true;
}

/**
 * TB-984 — projected-USD sponsor badge uses the same gates as external sponsor PDF:
 * sponsor-safe ROI basis plus Real (non-blocked) execution mode.
 */
export function isProjectedUsdSponsorBadgeVisible(
  payload: PilotRunDeltasProofSummaryJson | null,
): boolean {
  if (!isProjectedDollarClaimsSponsorSafe(payload)) {
    return false;
  }

  if (isExternalSponsorPdfBlockedForExecutionMode(payload)) {
    return false;
  }

  return true;
}

/** Human-readable execution mode from persisted pilot-run-deltas (Real / Simulator / Fallback / Mixed). */
export function formatStructuralExecutionModeLabel(
  payload: PilotRunDeltasProofSummaryJson | null,
): string {
  const raw = (payload as { structuralExecutionMode?: string | number } | null)?.structuralExecutionMode;

  if (raw === undefined || raw === null || raw === "") {
    return "Unknown";
  }

  if (raw === 0 || raw === "0" || raw === "Simulator") {
    return "Simulator";
  }

  if (raw === 1 || raw === "1" || raw === "Real") {
    return "Real";
  }

  if (raw === 2 || raw === "2" || raw === "Fallback") {
    return "Fallback";
  }

  if (raw === 3 || raw === "3" || raw === "Mixed") {
    return "Mixed";
  }

  return String(raw);
}

/**
 * G1 execution-mode honesty — block external sponsor PDF when mode is not Real without curated-sample override.
 * Aligns with {@link SPONSOR_CLAIM_LABEL_AUDIT} rule 1 and run-detail first-screen HOLD posture.
 */
export function isExternalSponsorPdfBlockedForExecutionMode(
  payload: PilotRunDeltasProofSummaryJson | null,
): boolean {
  const fellBack =
    (payload as { realModeFellBackToSimulator?: boolean } | null)?.realModeFellBackToSimulator === true;

  if (fellBack) {
    return true;
  }

  const label = formatStructuralExecutionModeLabel(payload);

  if (label === "Unknown") {
    return false;
  }

  return label !== "Real";
}

/** When false, strict AI quality signals failed — withhold sponsor PDF on real-mode hosts. */
export function isAgentOutputPilotStrictSponsorSafe(
  payload: PilotRunDeltasProofSummaryJson | null,
): boolean {
  const satisfied = payload?.proofPackageCompleteness?.agentOutputPilotStrictEvidenceSatisfied;

  if (satisfied === undefined) {
    return true;
  }

  return satisfied === true;
}

export function describeSponsorProofReadiness(
  payload: PilotRunDeltasProofSummaryJson | null,
): SponsorProofReadinessCopy | null {
  if (payload?.proofPackageCompleteness === undefined || payload.proofPackageCompleteness === null) {
    return null;
  }

  const c = payload.proofPackageCompleteness;
  const demoFlag = c.demoTenantWarningRequired === true || payload.isDemoTenant === true;

  const classification = (c.sponsorProofReadiness ?? "").trim();

  if (demoFlag || classification === "DemoOnly") {
    return {
      variant: "blocked",
      classification: "DemoOnly",
      title: "Demo / seeded data — not externally publishable",
      detail:
        "Sponsor-proof readiness is DemoOnly. Use exports for internal walkthroughs only; replace with a live-tenant run before sponsor circulation.",
    };
  }

  if (classification === "Incomplete") {
    return {
      variant: "blocked",
      classification: "Incomplete",
      title: "Incomplete — not sponsor-sendable yet",
      detail:
        "Persisted classification is Incomplete — open the first-value Markdown report, resolve structural or attestation gaps, then retry.",
    };
  }

  if (classification === "NeedsBaseline") {
    return {
      variant: "caveats",
      classification: "NeedsBaseline",
      title: "Needs baseline — review before dollar or customer-specific ROI claims",
      detail:
        "Only comparative ROI baseline posture is weak. Capture tenant baseline values (see first-value report) before external sponsor send.",
    };
  }

  if (classification === "Sendable") {
    return {
      variant: "ready",
      classification: "Sendable",
      title: "Sponsor-send ready (persisted classification)",
      detail:
        "Sponsor-proof readiness is Sendable. Still verify qualitative baselines and attachments — this banner is not a legal attestation.",
    };
  }

  const sendability = (c.proofSendability ?? "").trim();

  if (sendability === "NotSendable") {
    return {
      variant: "blocked",
      classification: "Incomplete",
      title: "Not sponsor-sendable (persisted gate)",
      detail:
        "The buyer-safe gate reports NotSendable — open the first-value Markdown report, resolve structural gaps, then retry.",
    };
  }

  const roi = (c.roiEvidenceConfidence ?? "").trim();
  const roiNeedsCaveat = roi === "Partial" || roi === "Low";

  if (sendability === "SendableWithCaveats" || roiNeedsCaveat) {
    return {
      variant: "caveats",
      classification: null,
      title: "Sendable with caveats — review before email",
      detail:
        "Persisted proof is partial or uses a low-confidence ROI baseline. Read the buyer-safe gate and ROI evidence sections in the first-value report before external send.",
    };
  }

  if (sendability === "Sendable") {
    return {
      variant: "ready",
      classification: null,
      title: "Sponsor-send ready (persisted evidence gate)",
      detail:
        "No demo flag and proof sendability is Sendable. Still verify qualitative baselines and attachments — this banner is not a legal attestation.",
    };
  }

  return {
    variant: "unknown",
    classification: null,
    title: "Proof sendability unknown",
    detail: "The API returned an unexpected proofSendability value — confirm state in the first-value report.",
  };
}
