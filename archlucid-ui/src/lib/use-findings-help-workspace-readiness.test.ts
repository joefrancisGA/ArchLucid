import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getArchitectureDecisionRegister,
  getArchitectureRiskRegister,
} from "@/lib/api/governance-stickiness-api";
import { useFindingsHelpWorkspaceReadiness } from "@/lib/use-findings-help-workspace-readiness";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureRiskRegister: vi.fn(),
  getArchitectureDecisionRegister: vi.fn(),
}));

const mockedRiskRegister = vi.mocked(getArchitectureRiskRegister);
const mockedDecisionRegister = vi.mocked(getArchitectureDecisionRegister);

describe("useFindingsHelpWorkspaceReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes open, critical/high, awaiting decision, and recent resolutions", async () => {
    const recentUtc = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    mockedRiskRegister.mockResolvedValue({
      entries: [
        {
          findingId: "f-open-critical",
          title: "Open critical",
          severity: "Critical",
          category: "Security",
          statusLabel: "Open",
          agingDays: 1,
          isStale: false,
          evidenceHref: "/evidence/1",
          latestDisposition: null,
          humanReviewStatus: 1,
        },
        {
          findingId: "f-resolved",
          title: "Resolved",
          severity: "Warning",
          category: "Ops",
          statusLabel: "Closed",
          agingDays: 3,
          isStale: false,
          evidenceHref: "/evidence/2",
          latestDisposition: "Remediated",
          lastReviewedUtc: recentUtc,
        },
      ],
    });
    mockedDecisionRegister.mockResolvedValue({ decisions: [] });

    const { result } = renderHook(() => useFindingsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openFindingsLabel).toBe("1 open finding");
    expect(result.current.criticalAndHighLabel).toBe("1 critical or high finding");
    expect(result.current.awaitingDecisionLabel).toBe("1 finding awaiting decision");
    expect(result.current.recentlyResolvedLabel).toBe("1 recent resolution");
  });

  it("uses neutral empty states when no findings match", async () => {
    mockedRiskRegister.mockResolvedValue({ entries: [] });
    mockedDecisionRegister.mockResolvedValue({ decisions: [] });

    const { result } = renderHook(() => useFindingsHelpWorkspaceReadiness());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openFindingsLabel).toBe("No open findings");
    expect(result.current.criticalAndHighLabel).toBe("No critical or high findings");
    expect(result.current.awaitingDecisionLabel).toBe("No findings awaiting decision");
    expect(result.current.recentlyResolvedLabel).toBe("No recent resolutions");
  });
});
