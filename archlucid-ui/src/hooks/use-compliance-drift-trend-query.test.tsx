import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/api", () => ({
  getComplianceDriftTrend: vi.fn(),
}));

vi.mock("@/lib/api/http", () => ({
  isBrowser: () => true,
}));

import { getComplianceDriftTrend } from "@/lib/api";

import { useComplianceDriftTrendQuery } from "./use-compliance-drift-trend-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("useComplianceDriftTrendQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(getComplianceDriftTrend).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.mocked(getComplianceDriftTrend).mockReset();
  });

  it("refetches when operator scope changes", async () => {
    const { result, rerender } = renderHook(() => useComplianceDriftTrendQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getComplianceDriftTrend).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({ tenantId: tenantB, workspaceId: workspaceA, projectId: projectA });
    rerender();

    await waitFor(() => expect(getComplianceDriftTrend).toHaveBeenCalledTimes(2));
  });
});
