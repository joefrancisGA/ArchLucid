import type { ProofPackageCompletenessJson } from "@/lib/pilot-proof-readiness";

export type SponsorEvidenceSourceBadge =
  | "buyer-provided"
  | "uploaded-actual-amortized"
  | "azure-retail"
  | "heuristic-fallback"
  | "demo-derived"
  | "missing";

export type SponsorEvidenceFreshnessBadge = "fresh" | "stale" | "missing" | "not-collected";

export type SponsorArtifactEvidenceBadgeSummary = {
  readonly source: SponsorEvidenceSourceBadge;
  readonly freshness: SponsorEvidenceFreshnessBadge;
  readonly sourceLabel: string;
  readonly freshnessLabel: string;
  readonly warnBeforeSponsorSend: boolean;
};

export type ResolveSponsorArtifactEvidenceBadgeInput = {
  readonly isDemoTenant?: boolean;
  readonly proofPackageCompleteness?: ProofPackageCompletenessJson | null;
  readonly savingsPricingBasis?: string | null;
  readonly costEvidenceFreshnessStatus?: string | null;
};

function normalizeFreshness(status: string | null | undefined): SponsorEvidenceFreshnessBadge {
  const normalized = (status ?? "").trim().toLowerCase();

  if (normalized === "fresh")
    return "fresh";

  if (normalized === "stale")
    return "stale";

  if (normalized === "missing")
    return "missing";

  return "not-collected";
}

function freshnessLabel(freshness: SponsorEvidenceFreshnessBadge): string {
  switch (freshness) {
    case "fresh":
      return "Fresh";
    case "stale":
      return "Stale";
    case "missing":
      return "Missing";
    case "not-collected":
      return "Not collected";
    default: {
      const exhaustive: never = freshness;

      return exhaustive;
    }
  }
}

function resolveSourceBadge(input: ResolveSponsorArtifactEvidenceBadgeInput): SponsorEvidenceSourceBadge {
  if (input.isDemoTenant === true || input.proofPackageCompleteness?.demoTenantWarningRequired === true)
    return "demo-derived";

  const savingsBasis = (input.savingsPricingBasis ?? "").trim();

  if (savingsBasis === "Uploaded actual/amortized")
    return "uploaded-actual-amortized";

  if (savingsBasis === "Heuristic fallback")
    return "heuristic-fallback";

  const roiLabel = (input.proofPackageCompleteness?.roiEvidenceConfidence ?? "").trim().toLowerCase();

  if (roiLabel.includes("strong") || roiLabel.includes("tenant"))
    return "buyer-provided";

  if (savingsBasis === "Retail" || savingsBasis === "EA-adjusted" || savingsBasis.length === 0)
    return "azure-retail";

  return "missing";
}

function sourceLabel(source: SponsorEvidenceSourceBadge): string {
  switch (source) {
    case "buyer-provided":
      return "Buyer-provided baseline";
    case "uploaded-actual-amortized":
      return "Uploaded actual/amortized";
    case "azure-retail":
      return "Azure Retail catalog";
    case "heuristic-fallback":
      return "Heuristic fallback";
    case "demo-derived":
      return "Demo-derived";
    case "missing":
      return "Missing evidence source";
    default: {
      const exhaustive: never = source;

      return exhaustive;
    }
  }
}

/** Resolves sponsor-facing source and freshness badges from persisted proof and ROI signals. */
export function resolveSponsorArtifactEvidenceBadges(
  input: ResolveSponsorArtifactEvidenceBadgeInput,
): SponsorArtifactEvidenceBadgeSummary {
  const source = resolveSourceBadge(input);
  const freshness = normalizeFreshness(input.costEvidenceFreshnessStatus);
  const warnBeforeSponsorSend =
    source === "demo-derived"
    || source === "missing"
    || source === "heuristic-fallback"
    || freshness === "stale"
    || freshness === "missing"
    || freshness === "not-collected";

  return {
    source,
    freshness,
    sourceLabel: sourceLabel(source),
    freshnessLabel: freshnessLabel(freshness),
    warnBeforeSponsorSend,
  };
}
