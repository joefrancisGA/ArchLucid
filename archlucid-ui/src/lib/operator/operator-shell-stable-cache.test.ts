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
});
