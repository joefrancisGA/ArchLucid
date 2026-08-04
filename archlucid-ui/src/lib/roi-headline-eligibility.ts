import type { SponsorEvidenceSourceBadge } from "@/lib/sponsor-artifact-evidence-badge";

/**
 * Presentation eligibility for sponsor-facing ROI headlines.
 * Demo-derived and estimate-class sources never render as top-line KPIs.
 */
export type RoiHeadlineEligibility = "headline-eligible" | "illustrative-only" | "suppressed-with-cta";

export type RoiHeadlineBasis =
  | SponsorEvidenceSourceBadge
  | "estimate"
  | "buyer-provided"
  | "demo-derived";

const ILLUSTRATIVE_CONTAINER_LABEL =
  "Illustrative — based on demo data, not your environment" as const;

const ESTIMATE_CONTAINER_LABEL = "Illustrative — estimate basis, not buyer-provided" as const;

export const ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL = ILLUSTRATIVE_CONTAINER_LABEL;
export const ROI_HEADLINE_ILLUSTRATIVE_ESTIMATE_LABEL = ESTIMATE_CONTAINER_LABEL;

export const ROI_HEADLINE_SUPPRESSED_CTA =
  "Supply buyer-provided ROI baselines before treating dollar figures as sponsor-ready." as const;

/**
 * Given an evidence / basis label, return whether a dollar KPI may headline a sponsor surface.
 * Exhaustive over known source badges plus explicit estimate/demo/buyer aliases.
 */
export function resolveRoiHeadlineEligibility(basis: RoiHeadlineBasis): RoiHeadlineEligibility {
  switch (basis) {
    case "buyer-provided":
    case "uploaded-actual-amortized":
      return "headline-eligible";
    case "demo-derived":
      return "illustrative-only";
    case "estimate":
    case "heuristic-fallback":
    case "azure-retail":
      return "illustrative-only";
    case "missing":
      return "suppressed-with-cta";
    default: {
      const exhaustive: never = basis;

      return exhaustive;
    }
  }
}

export function roiHeadlineIllustrativeLabel(basis: RoiHeadlineBasis): string {
  const eligibility = resolveRoiHeadlineEligibility(basis);

  if (eligibility !== "illustrative-only") {
    return ROI_HEADLINE_ILLUSTRATIVE_ESTIMATE_LABEL;
  }

  if (basis === "demo-derived") {
    return ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL;
  }

  return ROI_HEADLINE_ILLUSTRATIVE_ESTIMATE_LABEL;
}

/** True when a sponsor headline KPI would be empty and should show the baseline CTA instead. */
export function shouldSuppressRoiHeadlineForSponsor(basis: RoiHeadlineBasis): boolean {
  const eligibility = resolveRoiHeadlineEligibility(basis);

  return eligibility === "suppressed-with-cta" || eligibility === "illustrative-only";
}
