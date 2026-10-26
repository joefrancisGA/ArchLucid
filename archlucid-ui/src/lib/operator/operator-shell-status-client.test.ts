import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAndHydrateOperatorShellStatus,
  fetchOperatorShellStatus,
  hydrateOperatorShellStatusCaches,
} from "@/lib/operator/operator-shell-status-client";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import { createOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";

const SCOPE: OperatorScopeQueryKey = {
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
};

const LLM_BUDGET: LlmMonthlyDollarBudgetStatus = {
  monthlyBudgetMonitoringActive: true,
  blocksAdditionalLlmExecution: false,
  utcMonth: "2026-08",
  hardCutoffUsdPerUtcMonth: 100,
  effectiveHardCapUsd: 100,
  purchasedCapBumpUsd: 0,
  estimatedUsdPressure: 42,
  assumedNextCallReservationUsd: 1,
  hardCapUtilizationFraction: 0.42,
  warnFraction: 0.75,
};

describe("operator shell status client", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates the LLM budget query cache before fetchAndHydrate returns", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ llmMonthlyBudgetStatus: LLM_BUDGET }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const queryClient = createOperatorQueryClient();
    const payload = await fetchAndHydrateOperatorShellStatus(queryClient, SCOPE);

    expect(payload.llmMonthlyBudgetStatus).toEqual(LLM_BUDGET);
    expect(queryClient.getQueryData(operatorQueryKeys.llmMonthlyBudgetStatus)).toEqual(LLM_BUDGET);
  });

  it("does not write LLM budget cache when the aggregated payload omits it", () => {
    const queryClient = createOperatorQueryClient();
    hydrateOperatorShellStatusCaches(queryClient, SCOPE, {
      trialStatus: null,
      catalogMigration: null,
      llmMonthlyBudgetStatus: null,
      alertsInboxSummary: null,
      usageStatus: null,
      homepageSettings: null,
      stickinessSnapshot: null,
      assignedToMeFindingsCount: null,
      reviewsAwaitingAction: null,
    });

    expect(queryClient.getQueryData(operatorQueryKeys.llmMonthlyBudgetStatus)).toBeUndefined();
  });

  it("hydrates home bundle query caches from shell status", () => {
    const queryClient = createOperatorQueryClient();
    hydrateOperatorShellStatusCaches(queryClient, SCOPE, {
      trialStatus: null,
      catalogMigration: null,
      llmMonthlyBudgetStatus: null,
      alertsInboxSummary: null,
      usageStatus: null,
      homepageSettings: {
        selectedRunId: "run-1",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: "Title",
        architectureName: "Arch",
        completedUtc: "2026-08-01T00:00:00Z",
        isSampleApproved: true,
      },
      stickinessSnapshot: {
        pilotFunnel: {
          firstRunCreatedUtc: null,
          firstGoldenManifestUtc: null,
          firstComparisonUtc: null,
          firstArtifactOrBundleDownloadUtc: null,
          firstReplayUtc: null,
          totalRunsInScope: 2,
          committedRunsInScope: 1,
          productLearningSignalsLast90Days: 0,
        },
        latestRunId: "run-2",
        comparisonEventsLast30Days: 3,
        pendingGovernanceApprovals: 1,
      },
      assignedToMeFindingsCount: 4,
      reviewsAwaitingAction: { items: [{ runId: "run-3", name: "Review", newFindingCount: 1, sourceRunId: "run-0" }] },
    });

    expect(queryClient.getQueryData(operatorQueryKeys.tenantHomepageSettings)?.selectedRunId).toBe("run-1");
    expect(queryClient.getQueryData(operatorQueryKeys.operatorStickinessSnapshot)?.latestRunId).toBe("run-2");
    expect(queryClient.getQueryData(operatorQueryKeys.governanceAssignedToMeFindingsCount(SCOPE))).toBe(4);
    expect(queryClient.getQueryData(operatorQueryKeys.governanceReviewsAwaitingAction(SCOPE))?.items).toHaveLength(1);
  });

  it("normalizes non-finite alerts inbox summary counts from shell status JSON to zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            alertsInboxSummary: {
              openCount: Number.NaN,
              acknowledgedCount: Number.NaN,
              resolvedCount: Number.NaN,
              blockingCount: Number.NaN,
              lastEvaluatedUtc: "2026-10-25T00:00:00Z",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const queryClient = createOperatorQueryClient();
    const payload = await fetchAndHydrateOperatorShellStatus(queryClient, SCOPE);

    expect(payload.alertsInboxSummary).toEqual({
      open: 0,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: "2026-10-25T00:00:00Z",
    });
    expect(queryClient.getQueryData(operatorQueryKeys.alertsInboxSummary(SCOPE))).toEqual(payload.alertsInboxSummary);
  });

  it("maps non-finite assigned-to-me findings count from shell status JSON to null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ assignedToMeFindingsCount: Number.NaN }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const queryClient = createOperatorQueryClient();
    const payload = await fetchAndHydrateOperatorShellStatus(queryClient, SCOPE);

    expect(payload.assignedToMeFindingsCount).toBeNull();
    expect(queryClient.getQueryData(operatorQueryKeys.governanceAssignedToMeFindingsCount(SCOPE))).toBeUndefined();
  });

  it("normalizes non-finite stickiness funnel counts from shell status JSON to zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            stickinessSnapshot: {
              pilotFunnel: {
                firstRunCreatedUtc: null,
                firstGoldenManifestUtc: null,
                firstComparisonUtc: null,
                firstArtifactOrBundleDownloadUtc: null,
                firstReplayUtc: null,
                totalRunsInScope: Number.NaN,
                committedRunsInScope: Number.NaN,
                productLearningSignalsLast90Days: Number.NaN,
              },
              latestRunId: "run-nan",
              comparisonEventsLast30Days: Number.NaN,
              pendingGovernanceApprovals: Number.NaN,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const payload = await fetchOperatorShellStatus();

    expect(payload.stickinessSnapshot).toEqual({
      pilotFunnel: {
        firstRunCreatedUtc: null,
        firstGoldenManifestUtc: null,
        firstComparisonUtc: null,
        firstArtifactOrBundleDownloadUtc: null,
        firstReplayUtc: null,
        totalRunsInScope: 0,
        committedRunsInScope: 0,
        productLearningSignalsLast90Days: 0,
      },
      latestRunId: "run-nan",
      comparisonEventsLast30Days: 0,
      pendingGovernanceApprovals: 0,
    });
  });

  it("treats stickinessSnapshot pilotFunnel null as absent when no top-level metrics exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ stickinessSnapshot: { pilotFunnel: null } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const payload = await fetchOperatorShellStatus();

    expect(payload.stickinessSnapshot).toBeNull();
  });

  it("maps top-level stickiness metrics when pilotFunnel is null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            stickinessSnapshot: {
              pilotFunnel: null,
              pendingGovernanceApprovals: 2,
              comparisonEventsLast30Days: 1,
              latestRunId: "run-top-level",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const payload = await fetchOperatorShellStatus();

    expect(payload.stickinessSnapshot).toEqual({
      pilotFunnel: {
        firstRunCreatedUtc: null,
        firstGoldenManifestUtc: null,
        firstComparisonUtc: null,
        firstArtifactOrBundleDownloadUtc: null,
        firstReplayUtc: null,
        totalRunsInScope: 0,
        committedRunsInScope: 0,
        productLearningSignalsLast90Days: 0,
      },
      latestRunId: "run-top-level",
      comparisonEventsLast30Days: 1,
      pendingGovernanceApprovals: 2,
    });
  });

  it("clears scope-agnostic caches when a later hydrate payload omits a concern", () => {
    const queryClient = createOperatorQueryClient();
    const activeTrial = { status: "Active", daysRemaining: 5 } as const;

    hydrateOperatorShellStatusCaches(queryClient, SCOPE, {
      trialStatus: activeTrial,
      catalogMigration: null,
      llmMonthlyBudgetStatus: null,
      alertsInboxSummary: null,
      usageStatus: null,
      homepageSettings: null,
      stickinessSnapshot: null,
      assignedToMeFindingsCount: null,
      reviewsAwaitingAction: null,
    });

    expect(queryClient.getQueryData(operatorQueryKeys.tenantTrialStatus)).toEqual(activeTrial);

    hydrateOperatorShellStatusCaches(queryClient, SCOPE, {
      trialStatus: null,
      catalogMigration: null,
      llmMonthlyBudgetStatus: null,
      alertsInboxSummary: null,
      usageStatus: null,
      homepageSettings: null,
      stickinessSnapshot: null,
      assignedToMeFindingsCount: null,
      reviewsAwaitingAction: null,
    });

    expect(queryClient.getQueryData(operatorQueryKeys.tenantTrialStatus)).toBeUndefined();
  });
});
