import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getRunSummary = vi.fn();
const routerPush = vi.fn();
const router = { push: routerPush };

vi.mock("@/lib/api", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => router,
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

import { useWhatIfBranchAutoCompare } from "./useWhatIfBranchAutoCompare";

describe("useWhatIfBranchAutoCompare", () => {
  it("ignores a ready response from the previous branch", async () => {
    routerPush.mockClear();
    const previous = Promise.withResolvers<{ hasGoldenManifest: boolean }>();
    const current = Promise.withResolvers<{ hasGoldenManifest: boolean }>();
    getRunSummary.mockImplementation((runId: string) =>
      runId === "previous-parent" ? previous.promise : current.promise,
    );

    const { rerender } = renderHook(({ parent, branch }) => useWhatIfBranchAutoCompare({
      enabled: true,
      parentRunId: parent,
      currentRunId: branch,
      hasCurrentManifest: true,
    }), { initialProps: { parent: "previous-parent", branch: "previous-branch" } });
    rerender({ parent: "current-parent", branch: "current-branch" });

    await act(async () => previous.resolve({ hasGoldenManifest: true }));
    expect(routerPush).not.toHaveBeenCalled();
    await act(async () => current.resolve({ hasGoldenManifest: true }));
    expect(routerPush).toHaveBeenCalledExactlyOnceWith(comparePageHrefAdaptive("current-parent", "current-branch"));
  });

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
      expect(routerPush).toHaveBeenCalledWith(comparePageHrefAdaptive("parent-run", "branch-run"));
    });
  });
});
