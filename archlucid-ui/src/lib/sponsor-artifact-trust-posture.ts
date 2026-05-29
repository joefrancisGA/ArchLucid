import type { ProofPackageCompletenessJson } from "@/lib/pilot-proof-readiness";

export type SponsorArtifactTrustPosture =
  | "evidence-backed"
  | "estimate"
  | "deferred"
  | "manual-review-required";

export type SponsorArtifactTrustPostureBadge = {
  readonly posture: SponsorArtifactTrustPosture;
  readonly display: string;
  readonly detail: string;
};

function postureBadge(
  posture: SponsorArtifactTrustPosture,
  display: string,
  detail: string,
): SponsorArtifactTrustPostureBadge {
  return { posture, display, detail };
}

export type ResolveSponsorArtifactTrustPostureInput = {
  readonly isDemoTenant?: boolean;
  readonly proofPackageCompleteness?: ProofPackageCompletenessJson | null;
};

/** Buyer-safe trust posture labels for sponsor exports (not legal attestations). */
export function resolveSponsorArtifactTrustPostures(
  input: ResolveSponsorArtifactTrustPostureInput,
): readonly SponsorArtifactTrustPostureBadge[] {
  const badges: SponsorArtifactTrustPostureBadge[] = [];
  const proof = input.proofPackageCompleteness;

  if (input.isDemoTenant === true || proof?.demoTenantWarningRequired === true) {
    badges.push(
      postureBadge(
        "manual-review-required",
        "Manual review required",
        "Demo-derived sample — replace with a live-tenant committed review before external sponsor circulation.",
      ),
    );

    return badges;
  }

  if (proof?.agentOutputPilotStrictEvidenceSatisfied === false) {
    badges.push(
      postureBadge(
        "manual-review-required",
        "Manual review required",
        "PilotStrict quality gate failed — resolve faithfulness and citation signals before sponsor send.",
      ),
    );
  }

  if (proof?.roiBaselineInputs?.projectedDollarClaimsSponsorSafe !== true) {
    badges.push(
      postureBadge(
        "estimate",
        "Estimate",
        "Projected dollar claims are not sponsor-safe — use qualitative ROI or capture buyer-provided baselines first.",
      ),
    );
  } else {
    badges.push(
      postureBadge(
        "evidence-backed",
        "Evidence-backed",
        "Persisted proof fields attest sponsor-safe ROI basis and PilotStrict posture for this run.",
      ),
    );
  }

  const classification = (proof?.sponsorProofReadiness ?? "").trim();

  if (classification === "NeedsBaseline") {
    badges.push(
      postureBadge(
        "estimate",
        "Estimate",
        "ROI baseline inputs are incomplete — label savings as comparative estimates until baselines are captured.",
      ),
    );
  }

  if (classification === "Incomplete" || (proof?.proofSendability ?? "").trim() === "NotSendable") {
    badges.push(
      postureBadge(
        "manual-review-required",
        "Manual review required",
        "Proof package is incomplete or not sendable — open the first-value report before external handoff.",
      ),
    );
  }

  return badges;
}
