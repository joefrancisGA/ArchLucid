import {
  resolveSponsorHeadlineScopeLabel,
  resolveSponsorSystemRowScopeLabel,
  resolveSponsorTrailing30DayScopeLabel,
  ROI_NON_ADDITIVITY_CAVEAT,
} from "@/lib/roi-sponsor-scope-labels";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { buildSponsorMarkdownMethodologyFooter } from "@/lib/sponsor-markdown-footer";
import {
  formatSponsorSummaryFiniteCountLine,
  formatSponsorSummaryOptionalStringLine,
} from "@/lib/sponsor/format-sponsor-summary-count-line";
import {
  SPONSOR_ROI_IDENTIFIED_PENDING_LABEL,
  SPONSOR_ROI_REALIZED_COMMITTED_LABEL,
  SPONSOR_ROI_REALIZED_NOT_STORED_LABEL,
} from "@/lib/sponsor/sponsor-roi-identified-vs-realized";

export type SponsorRoiSystemicIssueTrendPoint = {
  monthKey: string;
  count: number;
};

export type SponsorRoiSystemicIssueTrendSeries = {
  category: string;
  severity: string;
  findingId: string;
  points: SponsorRoiSystemicIssueTrendPoint[];
};

export type SponsorRoiSummary = {
  totalEstimatedUsdSavings: number;
  systemCount: number;
  latestRunCount: number;
  eaDiscountMultiplier: number;
  savingsPricingBasis: string;
  savingsPricingBasisDescription?: string;
  costEvidenceFreshnessStatus?: string;
  latestCostEvidenceCollectionTimestampUtc?: string | null;
  costEvidenceStaleAfterDays?: number;
  systems: Array<{
    systemName: string;
    runId: string;
    committedUtc: string | null;
    estimatedUsdSavings: number | null;
  }>;
  topSystemicIssues: Array<{
    category: string;
    severity: string;
    count: number;
  }>;
  resolvedFindingsCount30Days?: number;
  newlyDiscoveredFindingsCount30Days?: number;
  staleArchitectureRiskCount?: number;
  historicalTrends?: SponsorRoiSystemicIssueTrendSeries[];
  realizedValue?: {
    findingsRemediatedCount30Days: number;
    medianTimeToRemediationDays?: number | null;
    activeWaiversCount: number;
    waiversRetiredCount30Days: number;
    waiverExpiryReversionCount30Days: number;
    attestedIncidentsAvoided?: number | null;
    attestedRevenueOrRetentionImpact?: string | null;
    attestedReviewerTimeSavedNote?: string | null;
  };
  basisBreakdown?: {
    openEstimatedUsd: number;
    acceptedRiskUsd: number;
    needsEvidenceUsd: number;
    deferredUsd: number;
    waivedUsd: number;
    realizedUsd: number;
    rejectedNotApplicableUsd: number;
    totalPotentialUsd: number;
  };
  businessImpactCategoryCounts?: SponsorBusinessImpactCategoryCounts;
  expiringWaiversCount14Days?: number;
  orphanCandidates?: SponsorOrphanCandidateSummary;
  firstCommitUtc?: string | null;
  headlineSavingsScopeCode?: string;
  headlineSavingsScopeDescription?: string;
  systemRowSavingsScopeCode?: string;
  systemRowSavingsScopeDescription?: string;
  trailing30DayActivityScopeDescription?: string;
};

export type SponsorOrphanCandidateSummary = {
  candidateCount: number;
  annualSavingsUsd: number | null;
  evidenceRunId?: string | null;
};

export type SponsorBusinessImpactCategoryCounts = {
  securityThemeCount?: number;
  complianceThemeCount?: number;
  securityComplianceThemeCount: number;
  reliabilityThemeCount: number;
  costThemeCount?: number;
  governanceThemeCount?: number;
  otherThemeCount?: number;
};

function formatUsd(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Savings amount was not stored.";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeInline(value: string): string {
  return value.replace(/\|/g, "/").replace(/\r\n/g, "\n").replace(/\n/g, " ").trim();
}

function formatSponsorSystemicIssueSeverity(severity: string | null | undefined): string {
  if (severity === null || severity === undefined) {
    return "Severity was not stored.";
  }

  const trimmed = severity.trim();

  if (trimmed.length === 0) {
    return "Severity was stored empty.";
  }

  if (trimmed.toLowerCase() === "none") {
    return "No severity band was stored.";
  }

  return normalizeInline(trimmed);
}

function formatSponsorSystemRowName(systemName: string | null | undefined): string {
  if (systemName === null || systemName === undefined) {
    return "System name was not stored.";
  }

  const trimmed = systemName.trim();

  if (trimmed.length === 0) {
    return "System name was stored empty.";
  }

  return normalizeInline(trimmed);
}

/**
 * Client-side sponsor report markdown export from `/v1/roi/sponsor-report`.
 */
export function buildSponsorSummaryMarkdown(
  summary: SponsorRoiSummary,
  options?: { readonly reviewHonestyMarkdown?: string },
): string {
  const lines: string[] = [];

  lines.push("# Sponsor report — portfolio ROI");
  lines.push("");
  lines.push(`**Sponsor ROI honesty:** ${SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}`);
  lines.push(`**Policy influence:** ${POLICY_PACK_INFLUENCE_HONESTY_LINE}`);
  lines.push("");

  const reviewHonestyMarkdown = options?.reviewHonestyMarkdown?.trim() ?? "";

  if (reviewHonestyMarkdown.length > 0) {
    lines.push(reviewHonestyMarkdown);
    lines.push("");
  }
  lines.push(`- **Scope (headline):** ${resolveSponsorHeadlineScopeLabel(summary)}`);

  if (summary.basisBreakdown) {
    const identifiedPending = summary.basisBreakdown.openEstimatedUsd + summary.basisBreakdown.needsEvidenceUsd;

    lines.push(`- **${SPONSOR_ROI_IDENTIFIED_PENDING_LABEL}:** ${formatUsd(identifiedPending)}`);
    lines.push(`- **${SPONSOR_ROI_REALIZED_COMMITTED_LABEL}:** ${formatUsd(summary.basisBreakdown.realizedUsd)}`);
    lines.push(
      `- **Excluded from realized (deferred / waived / accepted-risk / not applicable):** ${formatUsd(summary.basisBreakdown.deferredUsd + summary.basisBreakdown.waivedUsd + summary.basisBreakdown.acceptedRiskUsd + summary.basisBreakdown.rejectedNotApplicableUsd)}`,
    );
  } else {
    lines.push(`- **Estimated USD savings (headline):** ${formatUsd(summary.totalEstimatedUsdSavings)}`);
    lines.push(`- **${SPONSOR_ROI_REALIZED_COMMITTED_LABEL}:** ${SPONSOR_ROI_REALIZED_NOT_STORED_LABEL}`);
  }

  lines.push(
    formatSponsorSummaryOptionalStringLine(
      "Savings pricing basis",
      summary.savingsPricingBasis,
      "Savings pricing basis was not stored.",
    ),
  );
  lines.push(
    typeof summary.eaDiscountMultiplier === "number" && Number.isFinite(summary.eaDiscountMultiplier)
      ? `- **EA discount multiplier:** ${summary.eaDiscountMultiplier}`
      : "- **EA discount multiplier:** EA discount multiplier was not stored.",
  );

  if (summary.savingsPricingBasisDescription) {
    lines.push(`- **Pricing basis note:** ${summary.savingsPricingBasisDescription}`);
  }

  if (summary.costEvidenceFreshnessStatus) {
    lines.push(`- **Cost evidence freshness:** ${summary.costEvidenceFreshnessStatus}`);
  }

  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Systems reviewed",
      summary.systemCount,
      "Systems reviewed count was not stored.",
    ),
  );
  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Latest runs included",
      summary.latestRunCount,
      "Latest run count was not stored.",
    ),
  );
  lines.push("");
  lines.push("## Top systemic issues");
  lines.push("");

  if (summary.topSystemicIssues.length === 0) {
    lines.push("_No systemic issues were returned in this summary._");
  } else {
    lines.push("| Category | Severity | Count |");
    lines.push("| --- | --- | ---: |");

    for (const issue of summary.topSystemicIssues) {
      lines.push(
        `| ${normalizeInline(issue.category)} | ${formatSponsorSystemicIssueSeverity(issue.severity)} | ${issue.count} |`,
      );
    }

    lines.push("");
  }

  if (
    summary.resolvedFindingsCount30Days !== undefined
    || summary.newlyDiscoveredFindingsCount30Days !== undefined
  ) {
    lines.push(`- **30-day activity scope:** ${resolveSponsorTrailing30DayScopeLabel(summary)}`);
  }

  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Resolved findings (30d)",
      summary.resolvedFindingsCount30Days,
      "Resolved finding count was not stored.",
    ),
  );
  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Newly discovered findings (30d)",
      summary.newlyDiscoveredFindingsCount30Days,
      "Newly discovered finding count was not stored.",
    ),
  );
  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Stale architecture risks",
      summary.staleArchitectureRiskCount,
      "Stale architecture risk count was not stored.",
    ),
  );
  lines.push(
    formatSponsorSummaryFiniteCountLine(
      "Waivers expiring in 14 days",
      summary.expiringWaiversCount14Days,
      "Expiring waiver count was not stored.",
    ),
  );

  lines.push("");
  lines.push("## Orphan candidates");
  lines.push("");

  if (summary.orphanCandidates === undefined) {
    lines.push("- **Orphan candidate count:** Orphan candidate count was not stored.");
  } else {
    const orphanCount = summary.orphanCandidates.candidateCount;
    lines.push(
      formatSponsorSummaryFiniteCountLine(
        "Orphan candidate count",
        orphanCount,
        "Orphan candidate count was not stored.",
      ),
    );
    const annualSavings = summary.orphanCandidates.annualSavingsUsd;
    lines.push(
      typeof annualSavings === "number" && Number.isFinite(annualSavings)
        ? `- **Annual savings (orphans):** ${formatUsd(annualSavings)}`
        : "- **Annual savings (orphans):** Annual savings were not stored.",
    );
  }

  lines.push("");
  lines.push("## Systems included");
  lines.push("");
  lines.push(`_${resolveSponsorSystemRowScopeLabel(summary)}_`);
  lines.push("");
  lines.push(`_${ROI_NON_ADDITIVITY_CAVEAT}_`);
  lines.push("");

  if (summary.systems.length === 0) {
    lines.push("_No systems were returned in this summary._");
  } else {
    lines.push("| System | Review ID | Estimated USD savings |");
    lines.push("| --- | --- | ---: |");

    for (const system of summary.systems) {
      lines.push(
        `| ${formatSponsorSystemRowName(system.systemName)} | \`${normalizeInline(system.runId)}\` | ${formatUsd(system.estimatedUsdSavings)} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Realized value (computed)");
  lines.push("");

  if (summary.realizedValue === undefined) {
    lines.push("- **Realized value:** Realized value was not stored.");
  } else {
    lines.push(`- **Findings remediated (30d):** ${summary.realizedValue.findingsRemediatedCount30Days}`);
    lines.push(`- **Active waivers:** ${summary.realizedValue.activeWaiversCount}`);
    lines.push(`- **Waivers retired (30d):** ${summary.realizedValue.waiversRetiredCount30Days}`);

    if (summary.realizedValue.medianTimeToRemediationDays === null || summary.realizedValue.medianTimeToRemediationDays === undefined) {
      lines.push("- **Median time to remediation (days):** Median time to remediation was not stored.");
    } else {
      lines.push(`- **Median time to remediation (days):** ${summary.realizedValue.medianTimeToRemediationDays}`);
    }
  }

  lines.push("");
  lines.push(buildSponsorMarkdownMethodologyFooter());
  lines.push("");

  return lines.join("\n");
}

export function SponsorReportMarkdownFilename(): string {
  return "sponsor-report-portfolio-roi.md";
}
