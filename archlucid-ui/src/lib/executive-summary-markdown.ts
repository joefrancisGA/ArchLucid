import { buildSponsorMarkdownMethodologyFooter } from "@/lib/sponsor-markdown-footer";

export type ExecutiveRoiSystemicIssueTrendPoint = {
  monthKey: string;
  count: number;
};

export type ExecutiveRoiSystemicIssueTrendSeries = {
  category: string;
  severity: string;
  findingId: string;
  points: ExecutiveRoiSystemicIssueTrendPoint[];
};

export type ExecutiveRoiSummary = {
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
  historicalTrends?: ExecutiveRoiSystemicIssueTrendSeries[];
};

function formatUsd(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
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

/**
 * Client-side executive summary markdown export from `/v1/roi/executive-summary`.
 */
export function buildExecutiveSummaryMarkdown(summary: ExecutiveRoiSummary): string {
  const lines: string[] = [];

  lines.push("# Executive summary — portfolio ROI");
  lines.push("");
  lines.push(`- **Estimated USD savings:** ${formatUsd(summary.totalEstimatedUsdSavings)}`);
  lines.push(`- **Savings pricing basis:** ${summary.savingsPricingBasis} (EA multiplier ${summary.eaDiscountMultiplier})`);

  if (summary.savingsPricingBasisDescription) {
    lines.push(`- **Pricing basis note:** ${summary.savingsPricingBasisDescription}`);
  }

  if (summary.costEvidenceFreshnessStatus) {
    lines.push(`- **Cost evidence freshness:** ${summary.costEvidenceFreshnessStatus}`);
  }

  lines.push(`- **Systems reviewed:** ${summary.systemCount}`);
  lines.push(`- **Latest runs included:** ${summary.latestRunCount}`);
  lines.push("");
  lines.push("## Top systemic issues");
  lines.push("");

  if (summary.topSystemicIssues.length === 0) {
    lines.push("_No systemic issues were returned in this summary._");
  } else {
    lines.push("| Category | Severity | Count |");
    lines.push("| --- | --- | ---: |");

    for (const issue of summary.topSystemicIssues) {
      lines.push(`| ${normalizeInline(issue.category)} | ${normalizeInline(issue.severity)} | ${issue.count} |`);
    }
  }

  lines.push("");
  lines.push("## Systems included");
  lines.push("");

  if (summary.systems.length === 0) {
    lines.push("_No systems were returned in this summary._");
  } else {
    lines.push("| System | Run ID | Estimated USD savings |");
    lines.push("| --- | --- | ---: |");

    for (const system of summary.systems) {
      lines.push(
        `| ${normalizeInline(system.systemName)} | \`${normalizeInline(system.runId)}\` | ${formatUsd(system.estimatedUsdSavings)} |`,
      );
    }
  }

  lines.push("");
  lines.push(buildSponsorMarkdownMethodologyFooter());
  lines.push("");

  return lines.join("\n");
}

export function executiveSummaryMarkdownFilename(): string {
  return "executive-summary-portfolio-roi.md";
}
