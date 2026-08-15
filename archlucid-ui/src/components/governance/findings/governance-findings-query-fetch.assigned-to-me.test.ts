import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { fetchAssignedToMeFindingQueueRows } from "@/components/governance/findings/governance-findings-query-fetch";
import { ApiRequestError } from "@/lib/api-request-error";
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

    const result = await fetchAssignedToMeFindingQueueRows({
      assigneeIdentities: ["owner@example.com"],
    });

    expect(governanceApi.getArchitectureRiskRegister).toHaveBeenCalledWith({ assignedToMe: true });
    expect(result.loadFailed).toBe(false);
    expect(result.failure).toBeNull();
    expect(result.assignedToMeBasis).toBe("assigned-register");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.findingId).toBe("finding-a");
  });

  it("falls back to broad register filtering when assigned register is empty", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister)
      .mockResolvedValueOnce({ entries: [] })
      .mockResolvedValueOnce({
        entries: [
          {
            findingId: "finding-b",
            title: "Broad assignment",
            severity: "Medium",
            category: "Security",
            statusLabel: "Open — not dispositioned",
            assignedToUserId: "jordan@example.com",
            agingDays: 1,
            isStale: false,
            evidenceHref: "/reviews/abc/findings/finding-b",
            humanReviewStatus: "Pending",
          },
        ],
      });

    const result = await fetchAssignedToMeFindingQueueRows({
      assigneeIdentities: ["jordan@example.com"],
    });

    expect(governanceApi.getArchitectureRiskRegister).toHaveBeenNthCalledWith(1, { assignedToMe: true });
    expect(governanceApi.getArchitectureRiskRegister).toHaveBeenNthCalledWith(2, { maxRows: 500 });
    expect(result.assignedToMeBasis).toBe("register-broad-filter");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.findingId).toBe("finding-b");
  });

  it("returns register-only basis when both register paths are empty", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister)
      .mockResolvedValueOnce({ entries: [] })
      .mockResolvedValueOnce({ entries: [] });

    const result = await fetchAssignedToMeFindingQueueRows({
      assigneeIdentities: ["jordan@example.com"],
    });

    expect(result.assignedToMeBasis).toBe("register-only");
    expect(result.rows).toHaveLength(0);
  });

  it("captures correlation id, http status, and attempt time on failure", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(
      new ApiRequestError("upstream unavailable", {
        problem: { title: "Unavailable", status: 503, errorCode: "DATABASE_UNAVAILABLE" },
        correlationId: "corr-assigned-fail",
        httpStatus: 503,
      }),
    );

    const result = await fetchAssignedToMeFindingQueueRows();

    expect(result.loadFailed).toBe(true);
    expect(result.failure).toMatchObject({
      correlationId: "corr-assigned-fail",
      httpStatus: 503,
      errorCode: "DATABASE_UNAVAILABLE",
    });
    expect(result.failure?.attemptedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
