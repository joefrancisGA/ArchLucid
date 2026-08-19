import { afterEach, describe, expect, it, vi } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { createOperatorQueryClient } from "@/lib/query/operator-query-client";
import { setupOperatorQueryClientPersistence } from "@/lib/query/operator-query-persist-client";
import { OPERATOR_QUERY_PERSIST_STORAGE_PREFIX } from "@/lib/query/operator-query-persist-scope";

describe("operator-query-persist-client (TB-2165)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it("persists allowlisted successful queries to sessionStorage", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "build-tb2165");

    const queryClient = createOperatorQueryClient();
    const teardown = setupOperatorQueryClientPersistence(queryClient);

    await queryClient.prefetchQuery({
      queryKey: operatorQueryKeys.tenantTrialStatus,
      queryFn: async () => ({ trialActive: true }),
    });

    await vi.advanceTimersByTimeAsync(1_100);

    const stored = Object.keys(sessionStorage).some((key) => key.startsWith(OPERATOR_QUERY_PERSIST_STORAGE_PREFIX));

    expect(stored).toBe(true);

    teardown();
    vi.useRealTimers();
  });

  it("does not persist denied query keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "build-tb2165-deny");

    const queryClient = createOperatorQueryClient();
    const teardown = setupOperatorQueryClientPersistence(queryClient);

    queryClient.setQueryData(operatorQueryKeys.sponsorRoiSummary, { savingsUsd: 1 });
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    const storedPayload = sessionStorage.getItem(
      Object.keys(sessionStorage).find((key) => key.startsWith(OPERATOR_QUERY_PERSIST_STORAGE_PREFIX)) ?? "",
    );

    expect(storedPayload ?? "").not.toContain("savingsUsd");

    teardown();
  });
});
