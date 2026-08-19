import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadDevTestingQuickJumpSnapshot } from "@/lib/load-dev-testing-quick-jump-snapshot";

vi.mock("@/lib/api/learning-evolution-api", () => ({
  fetchLearningPlans: vi.fn(),
}));

vi.mock("@/lib/api/policy-governance-api", () => ({
  listApprovalRequests: vi.fn(),
}));

vi.mock("@/lib/api/architecture-runs", () => ({
  getRunDetail: vi.fn(),
  listArtifacts: vi.fn(),
}));

import { getRunDetail, listArtifacts } from "@/lib/api/architecture-runs";
import { fetchLearningPlans } from "@/lib/api/learning-evolution-api";
import { listApprovalRequests } from "@/lib/api/policy-governance-api";

describe("loadDevTestingQuickJumpSnapshot", () => {
  beforeEach(() => {
    vi.mocked(fetchLearningPlans).mockResolvedValue({
      generatedUtc: "2026-01-01T00:00:00Z",
      plans: [{ planId: "plan-a", themeId: "theme-a", title: "Plan A", summary: "", priorityScore: 1, status: "open", createdUtc: "2026-01-01T00:00:00Z" }],
    });
    vi.mocked(listApprovalRequests).mockResolvedValue([
      {
        approvalRequestId: "approval-a",
        runId: "run-a",
        manifestVersion: "1",
        sourceEnvironment: "dev",
        targetEnvironment: "prod",
        status: "Pending",
        requestedBy: "tester",
        reviewedBy: null,
        requestComment: null,
        reviewComment: null,
        requestedUtc: "2026-01-01T00:00:00Z",
        reviewedUtc: null,
      },
    ]);
    vi.mocked(getRunDetail).mockResolvedValue({
      data: {
        run: {
          runId: "run-a",
          projectId: "project-a",
          createdUtc: "2026-01-01T00:00:00Z",
          goldenManifestId: "manifest-a",
        },
      },
      trace: null,
    } as never);
    vi.mocked(listArtifacts).mockResolvedValue([
      {
        artifactId: "artifact-a",
        artifactType: "SponsorReport",
        name: "summary.md",
        format: "text/markdown",
        createdUtc: "2026-01-01T00:00:00Z",
        contentHash: "hash",
        manifestId: "manifest-a",
        runId: "run-a",
      },
    ]);
  });

  it("caps and deduplicates entity ids from workspace probes", async () => {
    const snapshot = await loadDevTestingQuickJumpSnapshot(["run-a", "run-a", "run-b"]);

    expect(snapshot.plans).toEqual([{ planId: "plan-a" }]);
    expect(snapshot.runs).toEqual([{ runId: "run-a" }, { runId: "run-b" }]);
    expect(snapshot.approvalRequests).toEqual([{ approvalRequestId: "approval-a" }]);
    expect(snapshot.manifests).toEqual([{ manifestId: "manifest-a" }]);
    expect(snapshot.artifacts).toEqual([{ manifestId: "manifest-a", artifactId: "artifact-a" }]);
  });
});
