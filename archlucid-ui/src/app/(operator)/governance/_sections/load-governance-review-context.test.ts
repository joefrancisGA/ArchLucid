import { describe, expect, it, vi } from "vitest";

const apiHoisted = vi.hoisted(() => ({
  getRunSummary: vi.fn(),
  getRunDetail: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getRunSummary: apiHoisted.getRunSummary,
  getRunDetail: apiHoisted.getRunDetail,
}));

import { loadGovernanceReviewContext } from "./load-governance-review-context";

describe("loadGovernanceReviewContext", () => {
  it("returns title and currentManifestVersion when both loads succeed", async () => {
    apiHoisted.getRunSummary.mockResolvedValue({
      runId: "run-1",
      projectId: "default",
      displayName: "Payments platform",
      description: "Brief",
      createdUtc: "2026-01-01T00:00:00.000Z",
    });
    apiHoisted.getRunDetail.mockResolvedValue({
      data: { run: { currentManifestVersion: "3.4.1" } },
    });

    await expect(loadGovernanceReviewContext("run-1")).resolves.toEqual({
      displayTitle: "Payments platform",
      manifestVersion: "3.4.1",
    });
  });

  it("soft-fails missing fields without throwing", async () => {
    apiHoisted.getRunSummary.mockRejectedValue(new Error("summary failed"));
    apiHoisted.getRunDetail.mockRejectedValue(new Error("detail failed"));

    await expect(loadGovernanceReviewContext("run-1")).resolves.toEqual({
      displayTitle: null,
      manifestVersion: null,
    });
  });
});
