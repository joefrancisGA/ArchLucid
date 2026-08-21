import type { ProofPackageCompletenessJson } from "@/lib/pilot-proof-readiness";
import {
  resolveRoiHeadlineEligibility,
  ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL,
  ROI_HEADLINE_SUPPRESSED_CTA,
  type RoiHeadlineEligibility,
} from "@/lib/roi-headline-eligibility";
import {
  resolveSponsorArtifactEvidenceBadges,
  type ResolveSponsorArtifactEvidenceBadgeInput,
} from "@/lib/sponsor-artifact-evidence-badge";

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
        "Demo-derived sample — replace with a live-tenant finalized review before external sponsor circulation.",
      ),
    );

    return badges;
  }

  if (proof?.agentOutputPilotStrictEvidenceSatisfied === false) {
    badges.push(
      postureBadge(
        "manual-review-required",
        "Manual review required",
        "Strict AI quality checks failed — resolve faithfulness and citation signals before sponsor send.",
      ),
    );
  }

  if (proof?.roiBaselineInputs?.projectedDollarClaimsSponsorSafe !== true) {
    badges.push(
      postureBadge(
        "estimate",
        "Estimate",
        "Projected dollar claims are not export-ready — use qualitative ROI or capture buyer-provided baselines first.",
      ),
    );
  } else {
    badges.push(
      postureBadge(
        "evidence-backed",
        "Evidence-backed",
        "Persisted proof fields attest export-ready ROI basis and strict AI quality posture for this review.",
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
        "Proof export is incomplete or not sendable — open the first-value report before external handoff.",
      ),
    );
  }

  return badges;
}

export type SponsorRoiHeadlinePresentation = {
  readonly eligibility: RoiHeadlineEligibility;
  readonly sourceLabel: string;
  readonly containerLabel: string | null;
  readonly cta: string | null;
};

/**
 * Sponsor-facing ROI headline rule: demo-derived / estimate-class numbers never headline;
 * missing basis is suppressed with a baseline CTA.
 */
export function presentSponsorRoiHeadline(
  input: ResolveSponsorArtifactEvidenceBadgeInput,
): SponsorRoiHeadlinePresentation {
  const badges = resolveSponsorArtifactEvidenceBadges(input);
  const eligibility = resolveRoiHeadlineEligibility(badges.source);

  if (eligibility === "headline-eligible") {
    return {
      eligibility,
      sourceLabel: badges.sourceLabel,
      containerLabel: null,
      cta: null,
    };
  }

  if (eligibility === "suppressed-with-cta") {
    return {
      eligibility,
      sourceLabel: badges.sourceLabel,
      containerLabel: null,
      cta: ROI_HEADLINE_SUPPRESSED_CTA,
    };
  }

  return {
    eligibility,
    sourceLabel: badges.sourceLabel,
    containerLabel:
      badges.source === "demo-derived"
        ? ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL
        : "Illustrative — estimate basis, not buyer-provided",
    cta: null,
  };
}
