import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

export type BusinessImpactThemeCountsDisplay = {
  readonly security: string;
  readonly compliance: string;
  readonly securityCompliance: string;
  readonly reliability: string;
  readonly cost: string;
  readonly governance: string;
  readonly other: string;
};

function themeCountDisplay(
  counts: SponsorRoiSummary["businessImpactCategoryCounts"] | null | undefined,
  field:
    | "securityThemeCount"
    | "complianceThemeCount"
    | "securityComplianceThemeCount"
    | "reliabilityThemeCount"
    | "costThemeCount"
    | "governanceThemeCount"
    | "otherThemeCount",
): string {
  if (counts === null || counts === undefined) {
    return "Not returned";
  }

  const raw = counts[field];

  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return "Not returned";
  }

  return String(Math.max(0, Math.floor(raw)));
}

/** Theme KPI tiles — missing API fields must not read as zero (UU-543). */
export function readBusinessImpactThemeCountsDisplay(
  data: SponsorRoiSummary | null,
): BusinessImpactThemeCountsDisplay {
  const counts = data?.businessImpactCategoryCounts ?? null;

  return {
    security: themeCountDisplay(counts, "securityThemeCount"),
    compliance: themeCountDisplay(counts, "complianceThemeCount"),
    securityCompliance: themeCountDisplay(counts, "securityComplianceThemeCount"),
    reliability: themeCountDisplay(counts, "reliabilityThemeCount"),
    cost: themeCountDisplay(counts, "costThemeCount"),
    governance: themeCountDisplay(counts, "governanceThemeCount"),
    other: themeCountDisplay(counts, "otherThemeCount"),
  };
}
