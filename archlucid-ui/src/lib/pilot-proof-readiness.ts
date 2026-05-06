/**
 * Maps persisted `GET /v1/pilots/runs/{runId}/pilot-run-deltas` proof fields into sponsor-banner copy.
 * Business rules are enforced server-side — the UI only reflects JSON.
 */

export type ProofPackageCompletenessJson = {
  readonly demoTenantWarningRequired?: boolean;
  readonly proofSendability?: string;
  readonly publishingTier?: string;
  readonly roiEvidenceConfidence?: string;
};

export type PilotRunDeltasProofSummaryJson = {
  readonly isDemoTenant?: boolean;
  readonly proofPackageCompleteness?: ProofPackageCompletenessJson | null;
};

export type SponsorProofReadinessCopy = {
  readonly variant: "blocked" | "caveats" | "ready" | "unknown";
  readonly title: string;
  readonly detail: string;
};

/**
 * @param payload Parsed pilot-run-deltas JSON, or null when the request failed or body was empty.
 */
export function describeSponsorProofReadiness(
  payload: PilotRunDeltasProofSummaryJson | null,
): SponsorProofReadinessCopy | null {
  if (payload?.proofPackageCompleteness === undefined || payload.proofPackageCompleteness === null) {
    return null;
  }

  const c = payload.proofPackageCompleteness;
  const demoFlag = c.demoTenantWarningRequired === true || payload.isDemoTenant === true;

  if (demoFlag) {
    return {
      variant: "blocked",
      title: "Demo / seeded data — not externally publishable",
      detail:
        "Proof completeness shows a demo tenant flag. Use exports for internal walkthroughs only; replace with a live-tenant run before sponsor circulation.",
    };
  }

  const sendability = (c.proofSendability ?? "").trim();

  if (sendability === "NotSendable") {
    return {
      variant: "blocked",
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
      title: "Sendable with caveats — review before email",
      detail:
        "Persisted proof is partial or uses a low-confidence ROI baseline. Read the buyer-safe gate and ROI evidence sections in the first-value report before external send.",
    };
  }

  if (sendability === "Sendable") {
    return {
      variant: "ready",
      title: "Sponsor-send ready (persisted evidence gate)",
      detail:
        "No demo flag and proof sendability is Sendable. Still verify qualitative baselines and attachments — this banner is not a legal attestation.",
    };
  }

  return {
    variant: "unknown",
    title: "Proof sendability unknown",
    detail: "The API returned an unexpected proofSendability value — confirm state in the first-value report.",
  };
}
