import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/api/tenant-customer-success", () => ({
  fetchOperatorNextBestActions: vi.fn(),
}));

import { fetchOperatorNextBestActions } from "@/lib/api/tenant-customer-success";

import { useOperatorNextBestActionsQuery } from "./use-operator-next-best-actions-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("useOperatorNextBestActionsQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(fetchOperatorNextBestActions).mockResolvedValue([{ actionId: "a-1", title: "Tenant A action" }]);
  });

  afterEach(() => {
    vi.mocked(fetchOperatorNextBestActions).mockReset();
  });

  it("refetches when operator scope changes so tenant A actions are not reused for tenant B", async () => {
    const { result, rerender } = renderHook(() => useOperatorNextBestActionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchOperatorNextBestActions).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({
      tenantId: tenantB,
      workspaceId: workspaceA,
      projectId: projectA,
    });
    rerender();

    await waitFor(() => {
      expect(fetchOperatorNextBestActions).toHaveBeenCalledTimes(2);
    });
  });
});
