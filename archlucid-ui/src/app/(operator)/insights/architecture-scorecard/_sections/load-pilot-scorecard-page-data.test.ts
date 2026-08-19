import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getPilotScorecard: vi.fn(),
}));

vi.mock("@/lib/server-operator-scope", () => ({
  getServerResolvedScopeHeaders: vi.fn(),
}));

import { getPilotScorecard } from "@/lib/api";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";

import { loadPilotScorecardPageData } from "./load-pilot-scorecard-page-data";

describe("loadPilotScorecardPageData", () => {
  beforeEach(() => {
    vi.mocked(getPilotScorecard).mockReset();
    vi.mocked(getServerResolvedScopeHeaders).mockReset();
  });

  it("passes cookie-resolved scope headers to the scorecard API", async () => {
    const scopeHeaders = {
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-workspace-id": "22222222-2222-2222-2222-222222222222",
      "x-project-id": "33333333-3333-3333-3333-333333333333",
    };
    vi.mocked(getServerResolvedScopeHeaders).mockResolvedValue(scopeHeaders);
    vi.mocked(getPilotScorecard).mockResolvedValue({
      tenantId: scopeHeaders["x-tenant-id"],
      totalRunsCommitted: 1,
      totalManifestsCreated: 1,
      totalFindingsResolved: 0,
      averageTimeToManifestMinutes: 12,
      totalAuditEventsGenerated: 3,
      totalGovernanceApprovalsCompleted: 0,
      firstCommitUtc: "2026-08-01T00:00:00.000Z",
      daysSinceFirstCommit: 8,
      baselines: null,
      roiEstimate: null,
    });

    const loaded = await loadPilotScorecardPageData();

    expect(getPilotScorecard).toHaveBeenCalledWith({ scopeHeaders });
    expect(loaded.error).toBeNull();
    expect(loaded.data?.totalRunsCommitted).toBe(1);
  });

  it("returns an error payload when the scorecard API fails", async () => {
    vi.mocked(getServerResolvedScopeHeaders).mockResolvedValue({});
    vi.mocked(getPilotScorecard).mockRejectedValue(new Error("HTTP 503"));

    const loaded = await loadPilotScorecardPageData();

    expect(loaded.data).toBeNull();
    expect(loaded.error).toBe("HTTP 503");
  });
});
