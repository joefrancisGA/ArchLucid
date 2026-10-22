import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/pilots-marketing", () => ({
  getPilotScorecard: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { getPilotScorecard } from "@/lib/api/pilots-marketing";

import { usePilotScorecardPage } from "./use-pilot-scorecard-page";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function scorecardPayload() {
  return {
    tenantId,
    totalRunsCommitted: 2,
    totalManifestsCreated: 2,
    totalFindingsResolved: 1,
    averageTimeToManifestMinutes: 15,
    totalAuditEventsGenerated: 4,
    totalGovernanceApprovalsCompleted: 1,
    firstCommitUtc: "2026-08-01T00:00:00.000Z",
    daysSinceFirstCommit: 8,
    baselines: {
      baselineHoursPerReview: 8,
      baselineReviewsPerQuarter: 4,
      baselineArchitectHourlyCost: 150,
      updatedUtc: "2026-08-01T00:00:00.000Z",
    },
    roiEstimate: {
      annualReviewCostStatusQuoUsd: 4800,
      annualReviewSavingsFromReviewTimeLeverUsd: 1200,
      modelReference: "test",
      currency: "USD",
    },
  };
}

function OperatorQueryTestWrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

describe("usePilotScorecardPage", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(getPilotScorecard).mockResolvedValue(scorecardPayload());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(getPilotScorecard).mockReset();
  });

  it("forwards operator scope headers when saving ROI baselines", async () => {
    const { result } = renderHook(
      () =>
        usePilotScorecardPage({
          data: scorecardPayload(),
          error: null,
        }),
      { wrapper: OperatorQueryTestWrapper },
    );

    act(() => {
      result.current.setHours("10");
    });

    await act(async () => {
      await result.current.onSaveBaselines();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/proxy/v1/pilots/scorecard/baselines");
    expect(init?.method).toBe("PUT");

    const headers = new Headers(init?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);
  });
});
