import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/fetch-sponsor-dashboard-bundle-client", () => ({
  fetchSponsorDashboardBundleClient: vi.fn(),
}));

vi.mock("@/lib/api/http", () => ({
  isBrowser: () => true,
}));

import { fetchSponsorDashboardBundleClient } from "@/lib/fetch-sponsor-dashboard-bundle-client";

import { useSponsorDashboardBundleQuery } from "./use-sponsor-dashboard-bundle-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("useSponsorDashboardBundleQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(fetchSponsorDashboardBundleClient).mockResolvedValue({
      sponsorReport: { totalRunsCommitted: 1 } as never,
      complianceDriftTrend: [],
    });
  });

  afterEach(() => {
    vi.mocked(fetchSponsorDashboardBundleClient).mockReset();
  });

  it("refetches when operator scope changes", async () => {
    const { result, rerender } = renderHook(() => useSponsorDashboardBundleQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchSponsorDashboardBundleClient).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({ tenantId: tenantB, workspaceId: workspaceA, projectId: projectA });
    rerender();

    await waitFor(() => expect(fetchSponsorDashboardBundleClient).toHaveBeenCalledTimes(2));
  });
});
