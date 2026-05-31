import { describe, expect, it } from "vitest";

import { shellBootstrapReadPrincipal, type CurrentPrincipal } from "@/lib/current-principal";
import { buildFirstPilotReadinessRows } from "@/lib/first-pilot-readiness-cockpit";
import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

function principal(rank: number): CurrentPrincipal {
  return {
    ...shellBootstrapReadPrincipal,
    provenance: "auth-me",
    authorityRank: rank,
    maxAuthority:
      rank >= AUTHORITY_RANK.AdminAuthority
        ? "AdminAuthority"
        : rank >= AUTHORITY_RANK.ExecuteAuthority
          ? "ExecuteAuthority"
          : "ReadAuthority",
  };
}

function signals(overrides: Partial<FirstPilotOperatingRailSignals> = {}): FirstPilotOperatingRailSignals {
  return {
    setupReady: true,
    setupUnhealthy: false,
    evidenceReady: true,
    hasAnyRun: true,
    readyToFinalize: true,
    hasCommittedManifest: true,
    latestRunId: "run-1",
    firstCommittedRunId: "run-1",
    ...overrides,
  };
}

function scorecard(hasBaselines: boolean): PilotScorecardJson {
  return {
    tenantId: "tenant",
    totalRunsCommitted: 1,
    totalManifestsCreated: 1,
    totalFindingsResolved: 0,
    averageTimeToManifestMinutes: null,
    totalAuditEventsGenerated: 0,
    totalGovernanceApprovalsCompleted: 0,
    firstCommitUtc: null,
    daysSinceFirstCommit: null,
    baselines: hasBaselines
      ? {
          baselineHoursPerReview: 12,
          baselineReviewsPerQuarter: 8,
          baselineArchitectHourlyCost: 175,
          updatedUtc: "2026-05-28T00:00:00Z",
        }
      : null,
    roiEstimate: null,
  };
}

describe("buildFirstPilotReadinessRows", () => {
  it("marks admin cockpit rows ready when setup, evidence, review, and ROI baselines exist", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.AdminAuthority),
      signals: signals(),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "principal-authority")?.status).toBe("ready");
    expect(rows.find((r) => r.id === "roi-baselines")?.summary).toContain("customer-entered");
    expect(rows.find((r) => r.id === "second-review")?.summary).toContain("start a second architecture review");
  });

  it("shows execute users can fix missing ROI baselines", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.ExecuteAuthority),
      signals: signals(),
      scorecard: scorecard(false),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "principal-authority")?.status).toBe("ready");
    expect(rows.find((r) => r.id === "roi-baselines")?.status).toBe("attention");
    expect(rows.find((r) => r.id === "roi-baselines")?.summary).toContain("Capture review hours");
  });

  it("keeps read-only users from seeing mutation prompts as safe", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.ReadAuthority),
      signals: signals({ hasCommittedManifest: false, readyToFinalize: false, latestRunId: null }),
      scorecard: scorecard(false),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "principal-authority")?.status).toBe("attention");
    expect(rows.find((r) => r.id === "review-pipeline")?.status).toBe("attention");
    expect(rows.find((r) => r.id === "roi-baselines")?.status).toBe("attention");
    expect(rows.find((r) => r.id === "review-pipeline")?.summary).toContain("Read-only role cannot execute or finalize");
  });

  it("routes admins to config lint on system health", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.AdminAuthority),
      signals: signals(),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "config-lint")?.href).toBe("/admin/health");
  });

  it("routes read-only users to troubleshooting for config lint", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.ReadAuthority),
      signals: signals(),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "config-lint")?.href).toBe("/help/troubleshooting");
  });

  it("surfaces a data consistency row that stays non-ready until proof collection", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.AdminAuthority),
      signals: signals(),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "data-consistency")?.status).toBe("attention");
    expect(rows.find((r) => r.id === "data-consistency")?.summary).toContain("Review-readiness status");
  });

  it("marks data consistency blocked when health is unhealthy", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Unhealthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.AdminAuthority),
      signals: signals({ setupUnhealthy: true, setupReady: false }),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "data-consistency")?.status).toBe("blocked");
  });

  it("marks config lint blocked when admin has blocking findings", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal: principal(AUTHORITY_RANK.AdminAuthority),
      signals: signals(),
      scorecard: scorecard(true),
      scorecardLoadFailed: false,
      configLint: { blockingCount: 1, advisoryCount: 0, loadFailed: false },
    });

    expect(rows.find((r) => r.id === "config-lint")?.status).toBe("blocked");
  });

  it("surfaces API failure states without leaking details", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: null,
      healthLoadFailed: true,
      runsLoadFailed: true,
      principal: shellBootstrapReadPrincipal,
      signals: signals({ setupReady: false, evidenceReady: false, hasAnyRun: false, hasCommittedManifest: false }),
      scorecard: null,
      scorecardLoadFailed: true,
      configLint: null,
    });

    expect(rows.find((r) => r.id === "api-ready")?.status).toBe("unknown");
    expect(rows.find((r) => r.id === "principal-authority")?.status).toBe("unknown");
    expect(rows.find((r) => r.id === "azure-extractor")?.status).toBe("unknown");
    expect(rows.find((r) => r.id === "roi-baselines")?.status).toBe("unknown");
    expect(rows.find((r) => r.id === "data-consistency")?.status).toBe("unknown");
  });
});
