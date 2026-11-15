import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewPackageWhatIfExecute } from "@/hooks/use-review-package-what-if-execute";
import { getDraftRequest, submitDraftRequest } from "@/lib/api/draft-intake-api";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";
import type { BranchDraftResponse } from "@/types/draft-intake";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  submitDraftRequest: vi.fn(),
}));
vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: vi.fn(),
  upsertArchitectureDraftRegistryEntry: vi.fn(),
}));
vi.mock("@/lib/operations/review-pipeline-in-flight", () => ({
  trackReviewPipelineInFlight: vi.fn(),
}));
vi.mock("@/lib/operator/operator-query-invalidation", () => ({
  invalidateOperatorHomeRunsCaches: vi.fn(),
}));

const response: BranchDraftResponse = {
  parentDraftId: "parent-draft",
  branch: {
    draftId: "branch-draft",
    tenantId: "tenant",
    workspaceId: "workspace",
    projectId: "project",
    status: "Drafting",
    document: { freeTextIntent: "Review the revised checkout design.", actorSet: { actors: [] } },
    createdUtc: "2026-11-15T12:00:00Z",
    updatedUtc: "2026-11-15T12:01:00Z",
  },
};

describe("useReviewPackageWhatIfExecute", () => {
  beforeEach(() => {
    vi.mocked(getDraftRequest).mockReset();
    vi.mocked(submitDraftRequest).mockReset();
    vi.mocked(invalidateOperatorHomeRunsCaches).mockReset().mockResolvedValue(undefined);
  });

  it.each(["draft refresh", "home cache"] as const)(
    "opens the queued branch even when the %s fails after submit",
    async (failedStep) => {
      vi.mocked(getDraftRequest).mockResolvedValueOnce(response.branch);
      vi.mocked(submitDraftRequest).mockResolvedValue({
        draftId: response.branch.draftId,
        status: "RunSpawned",
        runId: "branch-review",
        requestId: "request",
      });
      if (failedStep === "draft refresh") {
        vi.mocked(getDraftRequest).mockRejectedValueOnce(new Error("Draft refresh failed."));
      } else {
        vi.mocked(getDraftRequest).mockResolvedValueOnce({ ...response.branch, status: "RunSpawned" });
        vi.mocked(invalidateOperatorHomeRunsCaches).mockRejectedValueOnce(new Error("Home cache failed."));
      }

      const { result } = renderHook(() => useReviewPackageWhatIfExecute("base-review"));

      await act(async () => result.current.executeBranch(response));

      expect(submitDraftRequest).toHaveBeenCalledExactlyOnceWith(response.branch.draftId, response.branch.updatedUtc);
      expect(trackReviewPipelineInFlight).toHaveBeenCalledWith("branch-review");
      expect(push).toHaveBeenCalledWith(runDetailHrefWithParentRun("branch-review", "base-review"));
      expect(result.current.errorMessage).toBeNull();
    },
  );
});
