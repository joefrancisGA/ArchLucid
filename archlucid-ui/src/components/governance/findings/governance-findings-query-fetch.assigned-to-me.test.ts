import { describe, expect, it, vi } from "vitest";

import { fetchAssignedToMeFindingQueueRows } from "@/components/governance/findings/governance-findings-query-fetch";
import * as governanceApi from "@/lib/api/governance-stickiness-api";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureRiskRegister: vi.fn(),
  getArchitectureDecisionRegister: vi.fn(),
}));

describe("fetchAssignedToMeFindingQueueRows", () => {
  it("requests assigned-to-me risk register rows only", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [
        {
          findingId: "finding-a",
          title: "Open assignment",
          severity: "High",
          category: "Security",
          statusLabel: "Open — not dispositioned",
          assignedToUserId: "owner@example.com",
          agingDays: 2,
          isStale: false,
          evidenceHref: "/reviews/abc/findings/finding-a",
          humanReviewStatus: "Pending",
        },
      ],
    });

    const result = await fetchAssignedToMeFindingQueueRows();

    expect(governanceApi.getArchitectureRiskRegister).toHaveBeenCalledWith({ assignedToMe: true });
    expect(result.loadFailed).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.findingId).toBe("finding-a");
  });
});
