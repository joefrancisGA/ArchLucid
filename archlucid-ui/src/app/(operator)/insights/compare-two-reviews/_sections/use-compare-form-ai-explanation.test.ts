import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { explainComparisonRuns } from "@/lib/api";

import { useCompareFormAiExplanation } from "./use-compare-form-ai-explanation";

vi.mock("@/lib/api", () => ({ explainComparisonRuns: vi.fn() }));

describe("useCompareFormAiExplanation", () => {
  it("clears pending state and ignores an old response after a new comparison starts", async () => {
    type Response = Awaited<ReturnType<typeof explainComparisonRuns>>;
    const pending = Promise.withResolvers<Response>();
    vi.mocked(explainComparisonRuns).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(useCompareFormAiExplanation);
    let request: Promise<void> | undefined;

    act(() => {
      request = result.current.loadAiExplanation("old-left", "old-right", false);
    });
    expect(result.current.aiLoading).toBe(true);

    act(() => {
      result.current.resetAiExplanation();
    });
    expect(result.current.aiLoading).toBe(false);

    await act(async () => {
      pending.reject(new Error("Previous comparison failed."));
      await request;
    });

    expect(result.current.aiFailure).toBeNull();
    expect(result.current.aiLoading).toBe(false);
  });
});
