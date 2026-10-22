import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRunSummary = vi.fn();
const routerPush = vi.fn();

vi.mock("@/lib/api", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: routerPush }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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
        "/insights/compare-two-reviews?priorRunId=parent-run&laterRunId=branch-run",
      );
    });
  });
});
