import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsState = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsState.params,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false, mounted: true }),
}));

import { useGraphPageUrlState } from "./use-graph-page-url-state";

describe("useGraphPageUrlState", () => {
  beforeEach(() => {
    searchParamsState.params = new URLSearchParams();
  });

  it("clears local runId when runId is removed from the URL", () => {
    searchParamsState.params = new URLSearchParams("runId=run-a");
    const setRunId = vi.fn();
    const setGraphLoadRequested = vi.fn();

    const { rerender } = renderHook(() =>
      useGraphPageUrlState({
        setRunId,
        setGraphLoadRequested,
        setPresentationView: vi.fn(),
        setMode: vi.fn(),
        setTypeFilter: vi.fn(),
        setDepth: vi.fn(),
        setNodeId: vi.fn(),
        setDecisionId: vi.fn(),
      }),
    );

    expect(setRunId).toHaveBeenCalledWith("run-a");
    expect(setGraphLoadRequested).toHaveBeenCalledWith(true);

    setRunId.mockClear();
    setGraphLoadRequested.mockClear();
    searchParamsState.params = new URLSearchParams();
    rerender();

    expect(setRunId).toHaveBeenCalledWith("");
    expect(setGraphLoadRequested).toHaveBeenCalledWith(false);
  });
});
