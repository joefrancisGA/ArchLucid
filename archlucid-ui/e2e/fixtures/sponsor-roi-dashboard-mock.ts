/**
 * Deterministic sponsor ROI dashboard mock payloads for Playwright E2E.
 *
 * Deduplication scenario (mirrors `SponsorRoiSummaryServiceExtendedTests.BuildExportAsync_deduplicates_findings…`):
 * - The same stable finding id appears on two committed runs.
 * - Export and systemic-issue rollups count it once, not twice.
 */
export const SPONSOR_ROI_DEDUP_SCENARIO = {
  /** Stable finding id duplicated across run-a and run-b in raw per-run data. */
  sharedFindingId: "finding-export-shared",
  /** Deduplicated systemic-issue count surfaced in `topSystemicIssues`. */
  deduplicatedSystemicIssueCount: 1,
  /** Per-run occurrences before unique-identity dedupe (documented for assertions). */
  rawFindingOccurrences: 2,
  /** Deduplicated production environment savings (USD). */
  deduplicatedProductionSavingsUsd: 100,
  /** Sum if duplicate rows were counted separately (USD). */
  rawProductionSavingsUsd: 150,
} as const;

const iso = "2026-04-15T12:00:00.000Z";

function sponsorRoiHistorySnapshotIso(daysAgo: number): string {
  const snapshot = new Date();

  snapshot.setUTCDate(snapshot.getUTCDate() - daysAgo);
  snapshot.setUTCHours(0, 0, 0, 0);

  return snapshot.toISOString();
}

/** GET /v1/roi/sponsor-report */
export function getSponsorRoiSummaryMockJson(): unknown {
  return {
    totalEstimatedUsdSavings: 145_000,
    systemCount: 2,
    latestRunCount: 2,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    savingsPricingBasisDescription: "List-price Azure retail rates (mock E2E fixture).",
    costEvidenceFreshnessStatus: "Fresh",
    latestCostEvidenceCollectionTimestampUtc: iso,
    costEvidenceStaleAfterDays: 90,
    firstCommitUtc: "2026-04-01T00:00:00.000Z",
    systems: [
      {
        systemName: "Claims Intake",
        runId: "run-a-claims-intake",
        committedUtc: iso,
        estimatedUsdSavings: 82_000,
      },
      {
        systemName: "Payments API",
        runId: "run-b-payments-api",
        committedUtc: iso,
        estimatedUsdSavings: 63_000,
      },
    ],
    topSystemicIssues: [
      {
        category: "CostOptimization",
        severity: "Warning",
        count: SPONSOR_ROI_DEDUP_SCENARIO.deduplicatedSystemicIssueCount,
      },
      {
        category: "Security",
        severity: "Critical",
        count: 2,
      },
    ],
    resolvedFindingsCount30Days: 2,
    newlyDiscoveredFindingsCount30Days: 3,
    staleArchitectureRiskCount: 1,
    basisBreakdown: {
      openEstimatedUsd: 120_000,
      acceptedRiskUsd: 0,
      needsEvidenceUsd: 0,
      deferredUsd: 0,
      waivedUsd: 0,
      realizedUsd: 25_000,
      rejectedNotApplicableUsd: 0,
      totalPotentialUsd: 145_000,
    },
    businessImpactCategoryCounts: {
      securityThemeCount: 2,
      complianceThemeCount: 1,
      securityComplianceThemeCount: 0,
      reliabilityThemeCount: 1,
      costThemeCount: 1,
      governanceThemeCount: 0,
      otherThemeCount: 0,
    },
    orphanCandidates: {
      candidateCount: 2,
      annualSavingsUsd: 12_000,
      evidenceRunId: "run-a-claims-intake",
    },
    historicalTrends: [
      {
        category: "CostOptimization",
        severity: "Warning",
        findingId: SPONSOR_ROI_DEDUP_SCENARIO.sharedFindingId,
        points: [
          { monthKey: "2026-03", count: 0 },
          { monthKey: "2026-04", count: 1 },
        ],
      },
    ],
    realizedValue: {
      findingsRemediatedCount30Days: 2,
      medianTimeToRemediationDays: 4,
      activeWaiversCount: 0,
      waiversRetiredCount30Days: 0,
      waiverExpiryReversionCount30Days: 0,
    },
  };
}

/** GET /v1/roi/sponsor-report/export — deduplicated rows and environment slices. */
export function getSponsorRoiExportMockJson(): unknown {
  return {
    rows: [
      {
        findingId: SPONSOR_ROI_DEDUP_SCENARIO.sharedFindingId,
        runId: "run-a-claims-intake",
        systemName: "Claims Intake",
        environment: "production",
        category: "CostOptimization",
        severity: "Warning",
        title: "Right-size underutilized SQL tier",
        affectedResource: "sql/claims-primary",
        estimatedUsdSavings: SPONSOR_ROI_DEDUP_SCENARIO.deduplicatedProductionSavingsUsd,
      },
    ],
    savingsByEnvironment: [
      {
        environment: "production",
        estimatedUsdSavings: SPONSOR_ROI_DEDUP_SCENARIO.deduplicatedProductionSavingsUsd,
      },
      {
        environment: "staging",
        estimatedUsdSavings: 40,
      },
    ],
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    savingsPricingBasisDescription: "List-price Azure retail rates (mock E2E fixture).",
    costEvidenceFreshnessStatus: "Fresh",
    latestCostEvidenceCollectionTimestampUtc: iso,
    costEvidenceStaleAfterDays: 90,
  };
}

/** GET /v1/roi/sponsor-report/history */
export function getSponsorRoiHistoryMockJson(): unknown {
  return {
    points: [
      {
        snapshotUtc: sponsorRoiHistorySnapshotIso(45),
        totalEstimatedUsdSavings: 90_000,
        criticalSecurityFindings: 1,
        realRunCount: 1,
        simulatorRunCount: 0,
        realModeSavingsUsd: 90_000,
        isMixedMode: false,
      },
      {
        snapshotUtc: sponsorRoiHistorySnapshotIso(15),
        totalEstimatedUsdSavings: 145_000,
        criticalSecurityFindings: 2,
        realRunCount: 2,
        simulatorRunCount: 0,
        realModeSavingsUsd: 145_000,
        isMixedMode: false,
      },
    ],
  };
}

/** GET /v1/governance/decisions-needed-summary */
export function getGovernanceDecisionsNeededSummaryMockJson(): unknown {
  return {
    totalDecisionItems: 2,
    staleRisks: 1,
    waiversExpiringWithin14Days: 0,
    pendingApprovals: 1,
    needsEvidenceFindings: 1,
  };
}

/** GET /v1/tenant/pilot-value-report */
export function getTenantPilotValueReportMockJson(): unknown {
  return {
    tenantId: "00000000-0000-0000-0000-000000000001",
    fromUtc: "2026-03-16T00:00:00.000Z",
    toUtc: "2026-04-16T00:00:00.000Z",
    totalRunsCommitted: 2,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 5,
    findingsBySeverity: {
      critical: 2,
      high: 1,
      medium: 1,
      low: 1,
      info: 0,
    },
    totalRecommendationsProduced: 4,
    averagePipelineCompletionSeconds: 7200,
    governanceApprovals: 2,
    governanceRejections: 0,
    policyPackAssignments: 1,
    comparisonOrDriftDetections: 1,
    uniqueAgentTypes: ["ArchitectureReviewer"],
    committedRunsTimeline: [
      {
        runId: "run-a-claims-intake",
        createdUtc: "2026-04-10T08:00:00.000Z",
        committedUtc: iso,
        systemName: "Claims Intake",
      },
      {
        runId: "run-b-payments-api",
        createdUtc: "2026-04-12T08:00:00.000Z",
        committedUtc: iso,
        systemName: "Payments API",
      },
    ],
    governancePendingApprovalsNow: 0,
    auditExportTruncated: false,
  };
}
