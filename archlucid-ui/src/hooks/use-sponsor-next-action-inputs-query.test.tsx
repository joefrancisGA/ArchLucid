import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/lib/pilot-value-report-fetch", () => ({
  fetchPilotValueReportJson: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getComplianceDriftTrend: vi.fn(),
}));

import { getComplianceDriftTrend } from "@/lib/api";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";

import { useSponsorNextActionInputsQuery } from "./use-sponsor-next-action-inputs-query";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceA = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectA = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const tenantB = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("useSponsorNextActionInputsQuery", () => {
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId: tenantA, workspaceId: workspaceA, projectId: projectA });
    vi.mocked(fetchPilotValueReportJson).mockResolvedValue({
      tenantId: tenantA,
      fromUtc: "2026-01-01T00:00:00.000Z",
      toUtc: "2026-02-01T00:00:00.000Z",
      totalRunsCommitted: 1,
      committedRunsTimeline: [{ runId: "run-a", committedUtc: "2026-01-15T00:00:00.000Z" }],
    });
    vi.mocked(getComplianceDriftTrend).mockResolvedValue([{ changeCount: 2, bucketStartUtc: "2026-01-01T00:00:00.000Z" }]);
  });

  afterEach(() => {
    vi.mocked(fetchPilotValueReportJson).mockReset();
    vi.mocked(getComplianceDriftTrend).mockReset();
  });

  it("refetches when operator scope changes so tenant A inputs are not reused for tenant B", async () => {
    const { result, rerender } = renderHook(
      () => useSponsorNextActionInputsQuery("30d"),
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
