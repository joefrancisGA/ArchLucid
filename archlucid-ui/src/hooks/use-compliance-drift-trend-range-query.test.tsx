import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/api", () => ({
  getComplianceDriftTrend: vi.fn(),
}));

import { getComplianceDriftTrend } from "@/lib/api";

import { useComplianceDriftTrendRangeQuery } from "./use-compliance-drift-trend-range-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("useComplianceDriftTrendRangeQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(getComplianceDriftTrend).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.mocked(getComplianceDriftTrend).mockReset();
  });

  it("refetches when operator scope changes", async () => {
    const { result, rerender } = renderHook(
      () => useComplianceDriftTrendRangeQuery("2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getComplianceDriftTrend).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({ tenantId: tenantB, workspaceId: workspaceA, projectId: projectA });
    rerender();

    await waitFor(() => expect(getComplianceDriftTrend).toHaveBeenCalledTimes(2));
  });
});
