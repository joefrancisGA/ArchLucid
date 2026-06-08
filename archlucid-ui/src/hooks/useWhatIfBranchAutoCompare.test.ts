import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRunSummary = vi.fn();
const routerPush = vi.fn();

vi.mock("@/lib/api", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

import { useWhatIfBranchAutoCompare } from "./useWhatIfBranchAutoCompare";

describe("useWhatIfBranchAutoCompare", () => {
  it("redirects to compare when both runs have golden manifests", async () => {
    getRunSummary.mockImplementation(async (runId: string) => ({
      runId,
      hasGoldenManifest: true,
    }));

    renderHook(() =>
      useWhatIfBranchAutoCompare({
        enabled: true,
        parentRunId: "parent-run",
        currentRunId: "branch-run",
        hasCurrentManifest: true,
      }),
    );

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        "/compare?leftRunId=parent-run&rightRunId=branch-run",
      );
    });
  });
});
