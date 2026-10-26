import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  hydrateOperatorShellStableCache,
  readOperatorShellStableCache,
  writeOperatorShellStableCache,
} from "@/lib/operator/operator-shell-stable-cache";
import { getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

describe("operator shell stable cache", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    sessionStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "test-commit");
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it("writes and rehydrates stable trial and migration snapshots", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "None" },
      catalogMigration: { inMigration: false },
    });

    const cached = readOperatorShellStableCache();

    expect(cached?.trialStatus?.status).toBe("None");
    expect(cached?.catalogMigration?.inMigration).toBe(false);

    const queryClient = getOperatorQueryClient();
    const hydrated = hydrateOperatorShellStableCache(queryClient, "tenant:workspace:project");

    expect(hydrated).toBe(true);
    expect(queryClient.getQueryData(operatorQueryKeys.tenantTrialStatus)).toEqual({ status: "None" });
    expect(queryClient.getQueryData(operatorQueryKeys.tenantCatalogMigrationStatus)).toEqual({
      inMigration: false,
    });
  });

  it("skips unstable trial lifecycle snapshots", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "Active", daysRemaining: 5 },
      catalogMigration: { inMigration: false },
    });

    const cached = readOperatorShellStableCache();

    expect(cached?.trialStatus).toBeUndefined();
    expect(cached?.catalogMigration?.inMigration).toBe(false);
  });

  it("discards stable cache entries with non-finite writtenAtMs", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "None" },
      catalogMigration: { inMigration: false },
    });

    const cached = readOperatorShellStableCache();

    expect(cached).not.toBeNull();

    sessionStorage.setItem(
      "archlucid:operator-shell-stable:v1",
      JSON.stringify({ ...cached, writtenAtMs: Number.NaN }),
    );

    expect(readOperatorShellStableCache()).toBeNull();
  });

  it("normalizes non-finite alerts inbox counts when reading stable cache", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "None" },
      catalogMigration: { inMigration: false },
      alertsInboxSummary: {
        open: 2,
        acknowledged: 0,
        resolved: 0,
        blocking: 1,
        lastEvaluatedUtc: null,
      },
    });

    const cached = readOperatorShellStableCache();

    expect(cached).not.toBeNull();

    sessionStorage.setItem(
      "archlucid:operator-shell-stable:v1",
      JSON.stringify({
        ...cached,
        alertsInboxSummary: {
          open: Number.NaN,
          acknowledged: 1,
          resolved: 0,
          blocking: Number.NaN,
          lastEvaluatedUtc: null,
        },
      }),
    );

    const reread = readOperatorShellStableCache();

    expect(reread?.alertsInboxSummary).toEqual({
      open: 0,
      acknowledged: 1,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });

    const queryClient = getOperatorQueryClient();
    hydrateOperatorShellStableCache(queryClient, "tenant:workspace:project");

    expect(queryClient.getQueryData(operatorQueryKeys.alertsInboxSummary("tenant:workspace:project"))).toEqual(
      reread?.alertsInboxSummary,
    );
  });

  it("normalizes non-finite alerts inbox counts when writing stable cache", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "None" },
      catalogMigration: { inMigration: false },
      alertsInboxSummary: {
        open: Number.NaN,
        acknowledged: 1,
        resolved: 0,
        blocking: -2,
        lastEvaluatedUtc: null,
      },
    });

    expect(readOperatorShellStableCache()?.alertsInboxSummary).toEqual({
      open: 0,
      acknowledged: 1,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });
  });

  it("does not persist alerts inbox summary without a stable shell snapshot", () => {
    writeOperatorShellStableCache({
      trialStatus: { status: "Active", daysRemaining: 5 },
      alertsInboxSummary: { open: 7, unacknowledged: 3, critical: 1 },
    });

    const cached = readOperatorShellStableCache();

    expect(cached).toBeNull();
  });
});
