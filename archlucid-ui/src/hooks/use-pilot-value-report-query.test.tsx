import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/pilot-value-report-fetch", () => ({
  fetchPilotValueReportJson: vi.fn(),
}));

import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";

import { usePilotValueReportQuery } from "./use-pilot-value-report-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("usePilotValueReportQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(fetchPilotValueReportJson).mockResolvedValue({
      tenantId: tenantA,
      fromUtc: "2026-01-01T00:00:00.000Z",
      toUtc: "2026-02-01T00:00:00.000Z",
      totalRunsCommitted: 1,
      committedRunsTimeline: [],
    });
  });

  afterEach(() => {
    vi.mocked(fetchPilotValueReportJson).mockReset();
  });

  it("refetches when operator scope changes so tenant A payload is not reused for tenant B", async () => {
    const { result, rerender } = renderHook(
      () => usePilotValueReportQuery("2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchPilotValueReportJson).toHaveBeenCalledTimes(1);

    writeOperatorScopeToStorage({
      tenantId: tenantB,
      workspaceId: workspaceA,
      projectId: projectA,
    });
    rerender();

    await waitFor(() => {
      expect(fetchPilotValueReportJson).toHaveBeenCalledTimes(2);
    });
  });
});
